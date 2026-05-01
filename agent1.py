#!/usr/bin/env python3
"""
Smart Web Pentest Agent — ReAct + local RAG + smart crawler + tool execution.

⚠️ Only use against targets you own or have explicit written authorization to test.
"""

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.parse
import urllib3
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple

import requests

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

from rag_local import LocalRAG, VULN_QUERIES
from crawler import SmartCrawler, Sitemap

# ═══ Config ══════════════════════════════════════════════════════════════════════
API_KEY = os.environ.get(
    "HACKTRICKS_API_KEY",
    "htk_eee2307410d82d82f26c8711b1ec21903430b374feff1a1729f968e8f4500e11",
)
CHAT_URL = "https://ai.hacktricks.wiki/api/v1/chat"
REPORT_DIR = os.path.expanduser("~/.guardian_reports")

HEADERS = {"X-API-Key": API_KEY, "Content-Type": "application/json"}

INTRUSIVE_TOOLS = {"sqlmap", "nikto", "hydra", "wpscan", "nuclei"}
ALLOWED_DOMAINS: List[str] = []  # e.g. ["*.example.com"]

DEBUG = False


# ═══ Debug logger ═════════════════════════════════════════════════════════════════
class ThinkLogger:
    BORDER = "═" * 72
    counter = 0

    @classmethod
    def _box(cls, kind: str, icon: str, body: str):
        if not DEBUG:
            return
        cls.counter += 1
        ts = datetime.now().strftime("%H:%M:%S")
        header = f"  [{ts}] #{cls.counter:02d} {icon} {kind}"
        print("\n╔" + cls.BORDER + "╗")
        print("║" + header.ljust(72) + "║")
        print("╠" + cls.BORDER + "╣")
        for line in body.splitlines() or [""]:
            chunk = line if len(line) <= 70 else line[:67] + "..."
            print("║  " + chunk.ljust(70) + "║")
        print("╚" + cls.BORDER + "╝")

    @classmethod
    def observe(cls, msg): cls._box("OBSERVE", "👁", msg)
    @classmethod
    def think(cls, msg): cls._box("THINK", "🧠", msg)
    @classmethod
    def plan(cls, msg): cls._box("PLAN", "📋", msg)
    @classmethod
    def act(cls, msg): cls._box("ACT", "⚡", msg)
    @classmethod
    def result(cls, msg): cls._box("RESULT", "📊", msg[:600])
    @classmethod
    def rag(cls, msg): cls._box("RAG", "📚", msg[:500])
    @classmethod
    def finding(cls, msg): cls._box("FINDING", "🚨", msg)
    @classmethod
    def llm_prompt(cls, msg): cls._box("LLM PROMPT", "📤", msg[:600])
    @classmethod
    def llm_response(cls, msg): cls._box("LLM RESPONSE", "📥", msg[:600])


# ═══ Data models ══════════════════════════════════════════════════════════════════
@dataclass
class Finding:
    severity: str
    title: str
    description: str
    evidence: str
    remediation: str
    tool: str = ""
    confidence: str = "medium"
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self):
        return asdict(self)


@dataclass
class Task:
    id: str
    description: str
    tool: Optional[str]
    params: Dict = field(default_factory=dict)
    status: str = "pending"
    result: Optional[str] = None


@dataclass
class PentestState:
    target: str
    objective: str
    start_time: str = field(default_factory=lambda: datetime.now().isoformat())
    findings: List[Finding] = field(default_factory=list)
    tasks: List[Task] = field(default_factory=list)
    recon: Dict = field(default_factory=dict)
    sitemap: Optional[Sitemap] = None
    thread_id: Optional[str] = None

    def add_finding(self, f: Finding):
        self.findings.append(f)
        ThinkLogger.finding(
            f"[{f.severity.upper()}] {f.title}\n"
            f"  {f.description}\n"
            f"  Evidence: {f.evidence}"
        )

    def to_context(self) -> str:
        findings = "\n".join(
            f"- [{f.severity.upper()}] {f.title}" for f in self.findings[-10:]
        ) or "No findings yet."
        tasks = "\n".join(
            f"- [{t.status}] {t.description}" for t in self.tasks[-10:]
        ) or "No tasks yet."
        sitemap_brief = ""
        if self.sitemap:
            d = self.sitemap.to_dict()["summary"]
            sitemap_brief = (
                f"\nSitemap: {d['total_endpoints']} endpoints "
                f"({d['with_params']} with params), "
                f"{d['forms']} forms, {d['apis']} APIs"
            )
        return (
            f"## Engagement\n"
            f"Target: {self.target}\n"
            f"Objective: {self.objective}\n"
            f"{sitemap_brief}\n"
            f"Findings ({len(self.findings)}):\n{findings}\n"
            f"Tasks:\n{tasks}\n"
        )


# ═══ Tool executor ════════════════════════════════════════════════════════════════
class ToolExecutor:
    def __init__(self, state: PentestState, dry_run: bool = False):
        self.state = state
        self.dry_run = dry_run
        self.auto_install = False

    # ── safety helpers ────────────────────────────────────────────
    def _in_scope(self, url: str) -> bool:
        if not ALLOWED_DOMAINS:
            return True
        host = urllib.parse.urlparse(url).netloc
        for d in ALLOWED_DOMAINS:
            if re.match(d.replace("*", ".*"), host):
                return True
        return False

    def _which(self, tool: str) -> Optional[str]:
        return shutil.which(tool)

    def _ensure_tool(self, tool: str) -> bool:
        if self._which(tool):
            return True
        print(f"[!] Tool '{tool}' not found.")
        if self.auto_install:
            ok = self._install(tool)
            return ok
        ans = input(f"    Install '{tool}' via apt? [y/N]: ").strip().lower()
        if ans == "y":
            return self._install(tool)
        return False

    def _install(self, tool: str) -> bool:
        print(f"  → sudo apt install -y {tool}")
        if self.dry_run:
            return True
        rc, _, err = self._run(["sudo", "apt", "install", "-y", tool], timeout=300)
        if rc != 0:
            print(f"  [!] install failed: {err[:200]}")
            return False
        return self._which(tool) is not None

    def _confirm_intrusive(self, tool: str) -> bool:
        if tool not in INTRUSIVE_TOOLS:
            return True
        ans = input(f"[!] '{tool}' is intrusive. Run it? [y/N]: ").strip().lower()
        return ans == "y"

    def _run(self, cmd: List[str], timeout: int = 60) -> Tuple[int, str, str]:
        ThinkLogger.act(" ".join(cmd))
        if self.dry_run:
            return 0, f"[DRY RUN] {' '.join(cmd)}", ""
        try:
            p = subprocess.run(
                cmd, capture_output=True, text=True, timeout=timeout, shell=False
            )
            return p.returncode, p.stdout, p.stderr
        except subprocess.TimeoutExpired:
            return -1, "", "timeout"
        except Exception as e:
            return -1, "", str(e)

    # ── recon ──────────────────────────────────────────────────
    def probe_target(self, url: str) -> Dict:
        if not self._in_scope(url):
            return {"error": "out of scope"}
        out = {"url": url, "headers": {}, "tech_stack": {}}
        try:
            r = requests.get(url, timeout=10, allow_redirects=True, verify=False)
            out["status_code"] = r.status_code
            out["final_url"] = r.url
            out["headers"] = dict(r.headers)
            out["tech_stack"]["server"] = r.headers.get("Server", "")
            out["tech_stack"]["powered_by"] = r.headers.get("X-Powered-By", "")

            sec = ["Content-Security-Policy", "X-Frame-Options",
                   "Strict-Transport-Security", "X-Content-Type-Options",
                   "Referrer-Policy", "Permissions-Policy"]
            missing = [h for h in sec if h not in r.headers]
            out["missing_security_headers"] = missing
            if missing:
                self.state.add_finding(Finding(
                    severity="medium",
                    title="Missing security headers",
                    description=f"Missing: {', '.join(missing)}",
                    evidence=str(missing),
                    remediation="Configure all standard security headers.",
                    tool="header_audit", confidence="high",
                ))

            for c in r.cookies:
                flags = []
                if not c.secure: flags.append("Secure")
                if not c.has_nonstandard_attr("HttpOnly"): flags.append("HttpOnly")
                if flags:
                    self.state.add_finding(Finding(
                        severity="low",
                        title=f"Insecure cookie: {c.name}",
                        description=f"Cookie missing flags: {', '.join(flags)}",
                        evidence=f"Set-Cookie: {c.name}",
                        remediation="Set Secure and HttpOnly on session cookies.",
                        tool="cookie_audit", confidence="high",
                    ))
        except Exception as e:
            out["error"] = str(e)
            return out

        # sensitive paths
        paths = ["/.env", "/.git/HEAD", "/admin", "/api", "/swagger-ui.html",
                 "/robots.txt", "/phpinfo.php", "/console", "/.htaccess",
                 "/backup.zip", "/web.config"]
        found = []
        for p in paths:
            try:
                rr = requests.get(url.rstrip("/") + p, timeout=5, verify=False,
                                  allow_redirects=False)
                if rr.status_code in (200, 301, 302, 401, 403):
                    found.append({"path": p, "status": rr.status_code})
            except Exception:
                pass
        out["discovered_paths"] = found

        for it in found:
            if it["path"] == "/.git/HEAD" and it["status"] == 200:
                self.state.add_finding(Finding(
                    severity="critical", title="Exposed .git directory",
                    description="The .git directory is publicly accessible.",
                    evidence=f"GET /.git/HEAD → {it['status']}",
                    remediation="Block /.git in webserver config.",
                    tool="path_discovery", confidence="high",
                ))
            elif it["path"] == "/.env" and it["status"] == 200:
                self.state.add_finding(Finding(
                    severity="critical", title="Exposed .env file",
                    description="Environment file is publicly accessible.",
                    evidence=f"GET /.env → {it['status']}",
                    remediation="Remove .env from web root.",
                    tool="path_discovery", confidence="high",
                ))
        return out

    # ── external tools ────────────────────────────────────────────
    def nmap(self, host: str, top_ports: int = 100) -> Dict:
        if not self._ensure_tool("nmap"):
            return {"error": "nmap not installed"}
        rc, out, err = self._run(
            ["nmap", "-Pn", "-T4", "--top-ports", str(top_ports), "-sV", host],
            timeout=180,
        )
        ports = re.findall(r"(\d+)/tcp\s+open\s+(\S+)\s*(.*)", out)
        info = [{"port": int(p), "service": s, "version": v.strip()} for p, s, v in ports]
        if any(p["port"] == 3306 for p in info):
            self.state.add_finding(Finding(
                severity="medium", title="MySQL exposed",
                description="MySQL service reachable on the target.",
                evidence=f"3306/tcp open",
                remediation="Restrict DB access to internal networks only.",
                tool="nmap", confidence="high",
            ))
        return {"ports": info, "raw": out[:2000]}

    def gobuster(self, url: str, wordlist: str = "/usr/share/wordlists/dirb/common.txt") -> Dict:
        if not self._ensure_tool("gobuster"):
            return {"error": "gobuster not installed"}
        if not os.path.exists(wordlist):
            wordlist = "/usr/share/dirb/wordlists/common.txt"
        rc, out, err = self._run(
            ["gobuster", "dir", "-u", url, "-w", wordlist, "-q", "-t", "30",
             "--no-error", "-k"],
            timeout=300,
        )
        hits = re.findall(r"(/\S+)\s+\(Status:\s+(\d+)\)", out)
        return {"hits": [{"path": p, "status": int(s)} for p, s in hits],
                "raw": out[:3000]}

    def whatweb(self, url: str) -> Dict:
        if not self._ensure_tool("whatweb"):
            return {"error": "whatweb not installed"}
        rc, out, err = self._run(["whatweb", "--no-errors", "-q", url], timeout=60)
        return {"raw": out.strip()[:2000]}

    def wafw00f(self, url: str) -> Dict:
        if not self._ensure_tool("wafw00f"):
            return {"error": "wafw00f not installed"}
        rc, out, err = self._run(["wafw00f", "-a", url], timeout=60)
        waf = ""
        patterns = [
            r"is behind\s+(.+?)\s+\(",
            r"is behind\s+(.+?)\s+WAF",
            r"detected:\s*(.+)$",
        ]
        for pat in patterns:
            m = re.search(pat, out, re.IGNORECASE | re.MULTILINE)
            if m:
                waf = m.group(1).strip()
                break
        if not waf:
            for known in ["Cloudflare", "Akamai", "AWS", "Imperva", "Sucuri",
                           "F5", "Barracuda", "ModSecurity", "Fastly"]:
                if known.lower() in out.lower():
                    waf = known
                    break
        return {"waf": waf, "raw": out[:1500]}

    def sslscan(self, host: str) -> Dict:
        if not self._ensure_tool("sslscan"):
            return {"error": "sslscan not installed"}
        rc, out, err = self._run(["sslscan", "--no-colour", host], timeout=120)
        return {"raw": out[:3000]}

    def nikto(self, url: str) -> Dict:
        if not self._confirm_intrusive("nikto"):
            return {"skipped": True}
        if not self._ensure_tool("nikto"):
            return {"error": "nikto not installed"}
        rc, out, err = self._run(["nikto", "-host", url, "-Tuning", "x6", "-maxtime", "120s"],
                                 timeout=180)
        return {"raw": out[:5000]}

    def sqlmap(self, url: str) -> Dict:
        if not self._confirm_intrusive("sqlmap"):
            return {"skipped": True}
        if not self._ensure_tool("sqlmap"):
            return {"error": "sqlmap not installed"}
        rc, out, err = self._run(
            ["sqlmap", "-u", url, "--batch", "--level=2", "--risk=1",
             "--random-agent", "--timeout=15"],
            timeout=600,
        )
        vuln = "is vulnerable" in out.lower() or "parameter" in out.lower() and "injectable" in out.lower()
        if vuln:
            self.state.add_finding(Finding(
                severity="critical", title="SQL injection (sqlmap)",
                description="sqlmap confirmed an injectable parameter.",
                evidence=out[-1500:],
                remediation="Use parameterized queries / prepared statements.",
                tool="sqlmap", confidence="high",
            ))
        return {"vulnerable": vuln, "raw": out[-3000:]}

    # ── lightweight probes ────────────────────────────────────────────
    def test_xss(self, url: str, param: str = "q") -> Dict:
        payload = "<script>alert('xss-poc')</script>"
        try:
            test = f"{url}{'&' if '?' in url else '?'}{param}={urllib.parse.quote(payload)}"
            r = requests.get(test, timeout=10, verify=False)
            if payload in r.text:
                self.state.add_finding(Finding(
                    severity="high", title="Reflected XSS",
                    description=f"Parameter '{param}' reflects unsanitized input.",
                    evidence=f"Payload reflected at {test}",
                    remediation="Encode output, use a strict CSP.",
                    tool="xss_probe", confidence="high",
                ))
                return {"vulnerable": True}
            return {"vulnerable": False}
        except Exception as e:
            return {"error": str(e)}

    def test_sqli(self, url: str, param: str = "id") -> Dict:
        payloads = ["'", "' OR '1'='1", "1' AND 1=1--", "1' AND 1=2--"]
        indicators = ["sql syntax", "mysql", "odbc", "ora-", "syntax error",
                      "warning: pg_", "sqlite_"]
        for p in payloads:
            try:
                test = f"{url}{'&' if '?' in url else '?'}{param}={urllib.parse.quote(p)}"
                r = requests.get(test, timeout=10, verify=False)
                low = r.text.lower()
                if any(ind in low for ind in indicators):
                    self.state.add_finding(Finding(
                        severity="high", title="Potential SQL injection",
                        description=f"Parameter '{param}' triggers DB error on payload.",
                        evidence=f"Payload: {p}",
                        remediation="Parameterized queries.",
                        tool="sqli_probe", confidence="medium",
                    ))
                    return {"vulnerable": True, "payload": p}
            except Exception:
                pass
        return {"vulnerable": False}

    def test_ssti(self, url: str, param: str = "name") -> Dict:
        payloads = [("{{7*7}}", "49"), ("${{7*7}}", "49"), ("<%= 7*7 %>", "49")]
        for payload, expected in payloads:
            try:
                test = f"{url}{'&' if '?' in url else '?'}{param}={urllib.parse.quote(payload)}"
                r = requests.get(test, timeout=10, verify=False)
                if expected in r.text and payload not in r.text:
                    self.state.add_finding(Finding(
                        severity="critical", title="Server-Side Template Injection",
                        description=f"Parameter '{param}' evaluates template syntax.",
                        evidence=f"{payload} → {expected} reflected",
                        remediation="Never render user input as a template.",
                        tool="ssti_probe", confidence="high",
                    ))
                    return {"vulnerable": True, "payload": payload}
            except Exception:
                pass
        return {"vulnerable": False}

    def test_open_redirect(self, url: str, param: str = "redirect") -> Dict:
        try:
            test = f"{url}{'&' if '?' in url else '?'}{param}=https://evil.example.com"
            r = requests.get(test, timeout=10, allow_redirects=False, verify=False)
            loc = r.headers.get("Location", "")
            if "evil.example.com" in loc:
                self.state.add_finding(Finding(
                    severity="medium", title="Open redirect",
                    description=f"Parameter '{param}' allows arbitrary external redirects.",
                    evidence=f"Location: {loc}",
                    remediation="Whitelist allowed redirect targets.",
                    tool="open_redirect_probe", confidence="high",
                ))
                return {"vulnerable": True}
        except Exception:
            pass
        return {"vulnerable": False}

    # ── dispatcher ──────────────────────────────────────────────────
    def execute(self, tool: str, params: Dict) -> Dict:
        ThinkLogger.act(f"Tool   : {tool}\nParams : {json.dumps(params)}")
        m = {
            "recon": self.probe_target,
            "nmap": self.nmap,
            "gobuster": self.gobuster,
            "whatweb": self.whatweb,
            "wafw00f": self.wafw00f,
            "sslscan": self.sslscan,
            "nikto": self.nikto,
            "sqlmap": self.sqlmap,
            "xss_test": self.test_xss,
            "sqli_test": self.test_sqli,
            "ssti_test": self.test_ssti,
            "open_redirect_test": self.test_open_redirect,
        }
        fn = m.get(tool)
        if not fn:
            return {"error": f"unknown tool {tool}"}
        try:
            res = fn(**params)
            ThinkLogger.result(json.dumps(res, default=str))
            return res
        except TypeError as e:
            return {"error": f"bad params: {e}"}
        except Exception as e:
            return {"error": str(e)}


# ═══ LLM ════════════════════════════════════════════════════════════════════════
class LLM:
    def __init__(self):
        self.thread_id: Optional[str] = None

    def chat(self, message: str) -> str:
        ThinkLogger.llm_prompt(message)
        url = f"{CHAT_URL}/{self.thread_id}" if self.thread_id else CHAT_URL
        r = requests.post(url, headers=HEADERS, json={"message": message}, timeout=120)
        r.raise_for_status()
        data = r.json()
        self.thread_id = data.get("thread_id", self.thread_id)
        resp = data.get("response", "")
        ThinkLogger.llm_response(resp)
        return resp

    def plan(self, state: PentestState, kb_context: str) -> List[Task]:
        prompt = (
            "You are an expert web pentester following OWASP methodology. "
            "Respond with ONLY a JSON array (no prose, no code fences).\n\n"
            f"{state.to_context()}\n\n"
            "Knowledge base excerpts:\n"
            f"{kb_context[:2500]}\n\n"
            "Generate the next 3-5 prioritized tasks. Each task object:\n"
            '  {"id":"T#","description":"...","tool":"<one of: recon,nmap,gobuster,'
            'whatweb,wafw00f,sslscan,nikto,sqlmap,xss_test,sqli_test,ssti_test,'
            'open_redirect_test,manual_review>","reason":"..."}'
        )
        raw = self.chat(prompt)
        return _parse_plan(raw)


def _parse_plan(raw: str) -> List[Task]:
    """Robust JSON array parser tolerant of LLM quirks."""
    if not raw:
        return []
    text = raw.strip()
    text = re.sub(r"^```(?:json)?", "", text).rstrip("`").strip()
    text = (text.replace("“", '"').replace("”", '"')
                .replace("‘", "'").replace("’", "'")
                .replace("—", "-").replace("–", "-"))
    m = re.search(r"\[.*\]", text, re.DOTALL)
    if not m:
        return []
    arr_text = m.group(0)
    arr_text = re.sub(r",(\s*[}\]])", r"\1", arr_text)

    try:
        data = json.loads(arr_text)
    except Exception:
        objs = []
        for om in re.finditer(r"\{[^{}]*\}", arr_text, re.DOTALL):
            try:
                objs.append(json.loads(re.sub(r",(\s*})", r"\1", om.group(0))))
            except Exception:
                continue
        data = objs

    tasks = []
    for i, t in enumerate(data):
        if not isinstance(t, dict):
            continue
        tasks.append(Task(
            id=t.get("id") or f"T{i+1}",
            description=t.get("description", ""),
            tool=t.get("tool"),
            params=t.get("params", {}),
        ))
    return tasks


# ═══ ReAct agent ════════════════════════════════════════════════════════════════
class ReActAgent:
    def __init__(self, target: str, objective: str, dry_run: bool = False,
                 use_playwright: bool = False, auto_install: bool = False,
                 max_iter: int = 12):
        self.state = PentestState(target=target, objective=objective)
        self.executor = ToolExecutor(self.state, dry_run=dry_run)
        self.executor.auto_install = auto_install
        self.llm = LLM()
        self.rag = LocalRAG()
        self.use_playwright = use_playwright
        self.max_iter = max_iter

    def _kb(self, query: str, k: int = 5) -> str:
        if not self.rag.ready:
            ThinkLogger.rag("Local RAG index not built. Run: python rag_local.py --index")
            return ""
        ctx = self.rag.context(query, k=k)
        ThinkLogger.rag(f"Query: {query}\n\n{ctx[:400]}")
        return ctx

    def run(self):
        print(f"\n{'═'*72}")
        print(f"  \U0001f577️  Smart Web Pentest Agent")
        print(f"  Target : {self.state.target}")
        print(f"  Goal   : {self.state.objective}")
        print(f"{'═'*72}\n")

        print("[Phase 1] \U0001f50d Initial recon...")
        self.state.recon = self.executor.probe_target(self.state.target)
        ThinkLogger.observe(json.dumps(self.state.recon, indent=2)[:1200])

        print("\n[Phase 2] \U0001f9f0 Tech fingerprint + WAF...")
        self.executor.execute("whatweb", {"url": self.state.target})
        self.executor.execute("wafw00f", {"url": self.state.target})

        print("\n[Phase 3] \U0001f578️  Crawling & building sitemap...")
        crawler = SmartCrawler(
            self.state.target,
            max_pages=40,
            use_playwright=self.use_playwright,
            debug=DEBUG,
        )
        sitemap = crawler.crawl()
        self.state.sitemap = sitemap
        sitemap.print_sitemap()

        print("\n[Phase 4] \U0001f3af Endpoint vulnerability matrix...")
        self._scan_endpoints()

        print(f"\n[Phase 5] \U0001f9e0 ReAct loop (max {self.max_iter})...")
        kb = self._kb(
            f"web pentest {self.state.objective} "
            f"{self.state.recon.get('tech_stack', {}).get('server', '')}",
            k=6,
        )
        tasks = self.llm.plan(self.state, kb)
        for t in tasks:
            self.state.tasks.append(t)
        ThinkLogger.plan("\n".join(f"{t.id} → {t.description} [{t.tool}]" for t in tasks))

        for i in range(self.max_iter):
            pending = [t for t in self.state.tasks if t.status == "pending"]
            if not pending:
                ThinkLogger.think("No more pending tasks; engagement complete.")
                break
            t = pending[0]
            t.status = "running"
            ThinkLogger.think(f"Iter {i+1}: executing {t.id} — {t.description}")
            if t.tool and t.tool != "manual_review":
                params = dict(t.params or {})
                params.setdefault("url", self.state.target)
                if t.tool in ("nmap", "sslscan"):
                    params = {"host": urllib.parse.urlparse(self.state.target).netloc}
                res = self.executor.execute(t.tool, params)
                t.result = json.dumps(res, default=str)[:2000]
            else:
                t.result = "manual review"
            t.status = "done"

            reflect = self.llm.chat(
                f"Task {t.id} completed.\nResult:\n{t.result[:1200]}\n\n"
                f"State:\n{self.state.to_context()}\n\n"
                "In 2-3 sentences: should we add follow-up tasks? "
                "If yes, what tools/vectors? Be specific."
            )
            ThinkLogger.think(reflect)

            for vuln, kw in [("sqli", "sql injection"), ("xss", "xss"),
                              ("ssti", "template injection"), ("idor", "idor")]:
                if kw in reflect.lower() and not any(
                    vuln in (x.tool or "") for x in self.state.tasks
                ):
                    self.state.tasks.append(Task(
                        id=f"T{len(self.state.tasks)+1}",
                        description=f"Targeted {vuln} testing based on prior result",
                        tool=f"{vuln}_test" if vuln in ("sqli", "xss", "ssti") else "manual_review",
                    ))
                    break

        self.report()

    def _scan_endpoints(self):
        if not self.state.sitemap:
            return
        payloads_ctx = {
            "xss": self.rag.for_vector("xss") if self.rag.ready else "",
            "sqli": self.rag.for_vector("sqli") if self.rag.ready else "",
            "ssti": self.rag.for_vector("ssti") if self.rag.ready else "",
            "open_redirect": self.rag.for_vector("open_redirect") if self.rag.ready else "",
        }
        for k, v in payloads_ctx.items():
            if v:
                ThinkLogger.rag(f"[{k}] payloads loaded: {len(v)} chars")

        tested = 0
        for ep in self.state.sitemap.endpoints:
            if tested >= 25:
                break
            params = ep.params + ep.form_fields
            if not params:
                continue
            for p in params[:3]:
                self.executor.execute("xss_test", {"url": ep.url, "param": p})
                self.executor.execute("sqli_test", {"url": ep.url, "param": p})
                self.executor.execute("ssti_test", {"url": ep.url, "param": p})
                if "redirect" in p.lower() or "url" in p.lower() or "next" in p.lower():
                    self.executor.execute("open_redirect_test", {"url": ep.url, "param": p})
            tested += 1

    def report(self):
        print(f"\n{'═'*72}")
        print("[Phase 6] \U0001f4c4 Report")
        os.makedirs(REPORT_DIR, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        base = os.path.join(REPORT_DIR, f"pentest_{ts}")
        report = {
            "engagement": {
                "target": self.state.target,
                "objective": self.state.objective,
                "start_time": self.state.start_time,
                "end_time": datetime.now().isoformat(),
            },
            "findings": [f.to_dict() for f in self.state.findings],
            "tasks": [asdict(t) for t in self.state.tasks],
            "recon": self.state.recon,
            "sitemap": self.state.sitemap.to_dict() if self.state.sitemap else {},
        }
        with open(base + ".json", "w") as f:
            json.dump(report, f, indent=2, default=list)

        with open(base + ".md", "w") as f:
            f.write(f"# Pentest Report — {self.state.target}\n\n")
            f.write(f"**Date:** {datetime.now().isoformat()}\n\n")
            f.write(f"**Objective:** {self.state.objective}\n\n")
            f.write(f"## Findings ({len(self.state.findings)})\n\n")
            for fd in self.state.findings:
                f.write(f"### [{fd.severity.upper()}] {fd.title}\n")
                f.write(f"- **Confidence:** {fd.confidence}\n")
                f.write(f"- **Tool:** {fd.tool}\n")
                f.write(f"- **Description:** {fd.description}\n")
                f.write(f"- **Evidence:** `{fd.evidence}`\n")
                f.write(f"- **Remediation:** {fd.remediation}\n\n")

        sev = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
        for fd in self.state.findings:
            sev[fd.severity.lower()] = sev.get(fd.severity.lower(), 0) + 1
        print(f"  Saved: {base}.json + {base}.md")
        print("  Severity:")
        for k, v in sev.items():
            if v:
                print(f"    {k.upper():9} {v}")
        print(f"{'═'*72}\n")


# ═══ CLI ═════════════════════════════════════════════════════════════════════════
def main():
    ap = argparse.ArgumentParser(description="Smart Web Pentest Agent")
    ap.add_argument("target", nargs="?")
    ap.add_argument("--objective", default="comprehensive web application assessment")
    ap.add_argument("--debug", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--playwright", action="store_true")
    ap.add_argument("--auto-install", action="store_true",
                    help="install missing tools without prompting")
    ap.add_argument("--max-iter", type=int, default=12)
    ap.add_argument("--rag-stats", action="store_true")
    args = ap.parse_args()

    global DEBUG
    DEBUG = args.debug
    if DEBUG:
        print("[DEBUG ON] Full ReAct trace enabled.")

    if args.rag_stats:
        print(json.dumps(LocalRAG().stats(), indent=2))
        return

    if not args.target:
        ap.print_help()
        return

    print("[!] Only test targets you own or have explicit written authorization for.")
    if input("    Confirm authorization [y/N]: ").strip().lower() != "y":
        sys.exit(0)

    print(r"""
   ██████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗ ██╗ █████╗ ███╗   ██╗
  ██╔════╝ ██║   ██║██╔══██╗██╔══██╗██╔══██╗██║██╔══██╗████╗  ██║
  ██║  ███╗██║   ██║███████║██████╔╝██║  ██║██║███████║██╔██╗ ██║
  ██║   ██║██║   ██║██╔══██║██╔══██╗██║  ██║██║██╔══██║██║╚██╗██║
  ╚██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝██║██║  ██║██║ ╚████║
   ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝
""")

    agent = ReActAgent(
        target=args.target,
        objective=args.objective,
        dry_run=args.dry_run,
        use_playwright=args.playwright,
        auto_install=args.auto_install,
        max_iter=args.max_iter,
    )
    try:
        agent.run()
    except KeyboardInterrupt:
        print("\n[!] Interrupted — generating partial report")
        agent.report()


if __name__ == "__main__":
    main()
