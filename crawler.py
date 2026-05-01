#!/usr/bin/env python3
"""
Smart web crawler — builds a sitemap like a browser network pane.
Discovers links, forms, parameters, JS files, and API endpoints.
Optional Playwright support for SPA / JS-rendered apps.
"""

import re
import json
import urllib.parse
from collections import deque
from dataclasses import dataclass, field, asdict
from typing import Set, List, Dict, Optional

import requests
from bs4 import BeautifulSoup

try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False


@dataclass
class Endpoint:
    url: str
    method: str = "GET"
    params: List[str] = field(default_factory=list)
    form_fields: List[str] = field(default_factory=list)
    content_type: str = ""
    status: int = 0
    source: str = "html"  # html | js | form | api | playwright

    def to_dict(self):
        return asdict(self)


@dataclass
class Sitemap:
    target: str
    endpoints: List[Endpoint] = field(default_factory=list)
    js_files: Set[str] = field(default_factory=set)
    forms: List[Dict] = field(default_factory=list)
    api_endpoints: Set[str] = field(default_factory=set)
    parameters: Dict[str, Set[str]] = field(default_factory=dict)  # url → params

    def add_endpoint(self, ep: Endpoint):
        for existing in self.endpoints:
            if existing.url == ep.url and existing.method == ep.method:
                # merge params
                merged = list(set(existing.params) | set(ep.params))
                existing.params = merged
                return
        self.endpoints.append(ep)

    def to_dict(self):
        return {
            "target": self.target,
            "endpoints": [e.to_dict() for e in self.endpoints],
            "js_files": sorted(self.js_files),
            "forms": self.forms,
            "api_endpoints": sorted(self.api_endpoints),
            "parameters": {k: sorted(v) for k, v in self.parameters.items()},
            "summary": {
                "total_endpoints": len(self.endpoints),
                "with_params": sum(1 for e in self.endpoints if e.params),
                "forms": len(self.forms),
                "js_files": len(self.js_files),
                "apis": len(self.api_endpoints),
            },
        }

    def print_sitemap(self):
        print("\n" + "═" * 70)
        print(f"  🗺  SITEMAP — {self.target}")
        print("═" * 70)
        s = self.to_dict()["summary"]
        print(f"  Endpoints  : {s['total_endpoints']}  (with params: {s['with_params']})")
        print(f"  Forms      : {s['forms']}")
        print(f"  JS files   : {s['js_files']}")
        print(f"  API hints  : {s['apis']}")

        if self.endpoints:
            print("\n  ── Endpoints ──")
            for e in self.endpoints[:40]:
                params = f"?{','.join(e.params)}" if e.params else ""
                print(f"   [{e.method:4}] {e.url}{params}  ({e.source})")
            if len(self.endpoints) > 40:
                print(f"   ... +{len(self.endpoints) - 40} more")

        if self.forms:
            print("\n  ── Forms ──")
            for f in self.forms[:10]:
                print(f"   {f['method'].upper():4} {f['action']}")
                print(f"        fields: {', '.join(f['fields'])}")

        if self.api_endpoints:
            print("\n  ── API hints ──")
            for a in sorted(self.api_endpoints)[:20]:
                print(f"   {a}")
        print("═" * 70 + "\n")


class SmartCrawler:
    def __init__(self, target: str, max_pages: int = 50, timeout: int = 10,
                 use_playwright: bool = False, debug: bool = False):
        self.target = target.rstrip("/")
        parsed = urllib.parse.urlparse(self.target)
        self.scheme = parsed.scheme
        self.host = parsed.netloc
        self.max_pages = max_pages
        self.timeout = timeout
        self.use_playwright = use_playwright and PLAYWRIGHT_AVAILABLE
        self.debug = debug
        self.session = requests.Session()
        self.session.headers["User-Agent"] = (
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
        )
        self.visited: Set[str] = set()
        self.sitemap = Sitemap(target=self.target)

    def _same_host(self, url: str) -> bool:
        try:
            return urllib.parse.urlparse(url).netloc == self.host
        except Exception:
            return False

    def _normalize(self, base: str, link: str) -> Optional[str]:
        if not link:
            return None
        link = link.strip()
        if link.startswith(("javascript:", "mailto:", "tel:", "#")):
            return None
        try:
            absu = urllib.parse.urljoin(base, link)
            parsed = urllib.parse.urlparse(absu)
            # drop fragment
            cleaned = parsed._replace(fragment="").geturl()
            return cleaned
        except Exception:
            return None

    def _extract_params(self, url: str) -> List[str]:
        try:
            qs = urllib.parse.urlparse(url).query
            return list(urllib.parse.parse_qs(qs).keys())
        except Exception:
            return []

    def _parse_html(self, url: str, html: str, status: int, ctype: str):
        soup = BeautifulSoup(html, "lxml")

        # Record this page itself
        params = self._extract_params(url)
        ep = Endpoint(url=url, method="GET", params=params,
                     content_type=ctype, status=status, source="html")
        self.sitemap.add_endpoint(ep)
        if params:
            self.sitemap.parameters.setdefault(url.split("?")[0], set()).update(params)

        # Links
        new_urls = []
        for a in soup.find_all("a", href=True):
            nu = self._normalize(url, a["href"])
            if nu and self._same_host(nu):
                new_urls.append(nu)

        # Forms
        for form in soup.find_all("form"):
            action = self._normalize(url, form.get("action") or url)
            method = (form.get("method") or "GET").upper()
            fields = []
            for inp in form.find_all(["input", "textarea", "select"]):
                name = inp.get("name")
                if name:
                    fields.append(name)
            if action:
                self.sitemap.forms.append({
                    "action": action,
                    "method": method,
                    "fields": fields,
                })
                self.sitemap.add_endpoint(Endpoint(
                    url=action, method=method,
                    form_fields=fields, source="form",
                ))

        # JS files + API hints from inline scripts
        for sc in soup.find_all("script"):
            src = sc.get("src")
            if src:
                nu = self._normalize(url, src)
                if nu:
                    self.sitemap.js_files.add(nu)
            elif sc.string:
                # Crude API endpoint extraction from JS
                for m in re.finditer(r"""['"](/[a-zA-Z0-9_\-/.]+(?:/api|/v\d+)[a-zA-Z0-9_\-/.]*)['"]""", sc.string):
                    self.sitemap.api_endpoints.add(m.group(1))
                for m in re.finditer(r"""fetch\(['"]([^'"]+)['"]""", sc.string):
                    self.sitemap.api_endpoints.add(m.group(1))

        return new_urls

    def _scan_js_file(self, js_url: str):
        try:
            r = self.session.get(js_url, timeout=self.timeout)
            if r.status_code != 200:
                return
            text = r.text
            for m in re.finditer(r"""['"](/[a-zA-Z0-9_\-/.]+(?:/api|/v\d+)[a-zA-Z0-9_\-/.]*)['"]""", text):
                self.sitemap.api_endpoints.add(m.group(1))
            for m in re.finditer(r"""(?:fetch|axios\.\w+|\$\.(?:get|post|ajax))\(\s*['"]([^'"]+)['"]""", text):
                self.sitemap.api_endpoints.add(m.group(1))
        except Exception:
            pass

    def crawl(self) -> Sitemap:
        if self.use_playwright:
            self._crawl_playwright()
        else:
            self._crawl_requests()

        # Scan top JS files for additional API hints
        for js in list(self.sitemap.js_files)[:10]:
            self._scan_js_file(js)

        return self.sitemap

    def _crawl_requests(self):
        queue = deque([self.target])
        while queue and len(self.visited) < self.max_pages:
            url = queue.popleft()
            base_url = url.split("?")[0]
            if base_url in self.visited:
                continue
            self.visited.add(base_url)

            try:
                r = self.session.get(url, timeout=self.timeout, allow_redirects=True, verify=False)
            except Exception as e:
                if self.debug:
                    print(f"  [crawler] error {url}: {e}")
                continue

            ctype = r.headers.get("Content-Type", "")
            if "html" not in ctype.lower():
                continue

            new_urls = self._parse_html(r.url, r.text, r.status_code, ctype)
            for nu in new_urls:
                if nu.split("?")[0] not in self.visited:
                    queue.append(nu)

            if self.debug:
                print(f"  [crawler] {r.status_code} {r.url}")

    def _crawl_playwright(self):
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                ctx = browser.new_context(ignore_https_errors=True)
                page = ctx.new_page()

                # Capture network requests as they happen
                def on_request(req):
                    u = req.url
                    if not self._same_host(u):
                        return
                    rtype = req.resource_type
                    method = req.method
                    if rtype in ("xhr", "fetch"):
                        self.sitemap.api_endpoints.add(u)
                        self.sitemap.add_endpoint(Endpoint(
                            url=u, method=method, source="playwright",
                            params=self._extract_params(u),
                        ))
                    elif rtype == "script":
                        self.sitemap.js_files.add(u)

                page.on("request", on_request)

                queue = deque([self.target])
                while queue and len(self.visited) < self.max_pages:
                    url = queue.popleft()
                    base_url = url.split("?")[0]
                    if base_url in self.visited:
                        continue
                    self.visited.add(base_url)
                    try:
                        page.goto(url, timeout=self.timeout * 1000, wait_until="networkidle")
                        html = page.content()
                        new_urls = self._parse_html(url, html, 200, "text/html")
                        for nu in new_urls:
                            if nu.split("?")[0] not in self.visited:
                                queue.append(nu)
                    except Exception as e:
                        if self.debug:
                            print(f"  [playwright] error {url}: {e}")

                browser.close()
        except Exception as e:
            print(f"[!] Playwright failed ({e}); falling back to requests crawler.")
            self._crawl_requests()


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("target")
    ap.add_argument("--max-pages", type=int, default=50)
    ap.add_argument("--playwright", action="store_true")
    ap.add_argument("--debug", action="store_true")
    args = ap.parse_args()

    c = SmartCrawler(args.target, max_pages=args.max_pages,
                     use_playwright=args.playwright, debug=args.debug)
    sm = c.crawl()
    sm.print_sitemap()
    print(json.dumps(sm.to_dict(), indent=2, default=list))
