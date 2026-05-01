#!/usr/bin/env python3
"""
Local RAG engine for HackTricks + OWASP + PayloadsAllTheThings.
Uses BM25 (keyword) + sentence-transformers (semantic) hybrid retrieval.
"""

import os
import re
import json
import pickle
import hashlib
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Tuple

# Heavy deps: sentence-transformers + chromadb + rank_bm25
try:
    from rank_bm25 import BM25Okapi
except ImportError:
    BM25Okapi = None

try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
except ImportError:
    SentenceTransformer = None
    np = None

try:
    import chromadb
    from chromadb.config import Settings
except ImportError:
    chromadb = None


# ── Pickle compatibility shim ───────────────────────────────────────────────────────
# When the index is built by running this file directly (__main__), Chunk
# gets pickled as __main__.Chunk. When agent1.py imports rag_local, the same
# class is now rag_local.Chunk and pickle can't find it. Register both names.
import sys as _sys


def _pickle_shim():
    current = _sys.modules[__name__]
    for alias in ("__main__", "rag_local"):
        if alias not in _sys.modules:
            _sys.modules[alias] = current
        else:
            existing = _sys.modules[alias]
            for attr in ("Chunk", "LocalRAG", "LocalIndexer", "VULN_QUERIES"):
                if hasattr(current, attr) and not hasattr(existing, attr):
                    setattr(existing, attr, getattr(current, attr))


# ── Config ───────────────────────────────────────────────────────────────────────
INDEX_DIR = os.path.expanduser("~/.guardian_index")
KNOWLEDGE_SOURCES = [
    ("hacktricks", os.path.expanduser("~/hacktricks")),
    ("hacktricks-cloud", os.path.expanduser("~/hacktricks-cloud")),
    ("payloads", os.path.expanduser("~/PayloadsAllTheThings")),
    ("owasp-wstg", os.path.expanduser("~/owasp-wstg")),
]

CHUNK_SIZE = 800
CHUNK_OVERLAP = 150
EMBED_MODEL = "all-MiniLM-L6-v2"

VULN_QUERIES = {
    "xss": "reflected stored DOM XSS payloads bypass filters",
    "sqli": "SQL injection union error blind boolean time-based",
    "ssti": "server-side template injection jinja twig freemarker",
    "ssrf": "server-side request forgery internal metadata cloud",
    "rce": "remote code execution command injection",
    "lfi": "local file inclusion path traversal directory",
    "csrf": "cross-site request forgery token bypass",
    "idor": "insecure direct object reference authorization bypass",
    "open_redirect": "open redirect URL manipulation",
    "file_upload": "file upload bypass extension content-type webshell",
    "xxe": "XML external entity injection",
    "deserialization": "insecure deserialization PHP Java Python pickle",
    "auth_bypass": "authentication bypass JWT session",
    "prototype_pollution": "prototype pollution JavaScript Node.js",
    "zip_slip": "zip slip path traversal symlink archive",
}


# ── Data model ───────────────────────────────────────────────────────────────────
@dataclass
class Chunk:
    id: str
    source: str
    path: str
    title: str
    content: str
    tokens: List[str] = field(default_factory=list)


# ── Indexer ──────────────────────────────────────────────────────────────────────
class LocalIndexer:
    def __init__(self, index_dir: str = INDEX_DIR):
        self.index_dir = index_dir
        os.makedirs(index_dir, exist_ok=True)
        self.chunks_path = os.path.join(index_dir, "chunks.pkl")
        self.bm25_path = os.path.join(index_dir, "bm25.pkl")
        self.chroma_path = os.path.join(index_dir, "chroma")

    def _read_markdown_files(self, root: str, source_name: str) -> List[Tuple[str, str]]:
        files = []
        if not os.path.isdir(root):
            print(f"  [skip] {root} not found")
            return files
        for dirpath, _, filenames in os.walk(root):
            if "/.git" in dirpath or "/node_modules" in dirpath:
                continue
            for fn in filenames:
                if fn.endswith((".md", ".markdown")):
                    full = os.path.join(dirpath, fn)
                    try:
                        with open(full, "r", encoding="utf-8", errors="ignore") as f:
                            files.append((full, f.read()))
                    except Exception:
                        pass
        return files

    def _chunk_text(self, text: str, source: str, path: str) -> List[Chunk]:
        text = re.sub(r"```[\s\S]*?```", lambda m: m.group(0), text)
        title_match = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
        title = title_match.group(1).strip() if title_match else os.path.basename(path)

        chunks = []
        i = 0
        n = len(text)
        while i < n:
            piece = text[i:i + CHUNK_SIZE]
            if len(piece.strip()) < 50:
                i += CHUNK_SIZE - CHUNK_OVERLAP
                continue
            cid = hashlib.sha256(f"{path}:{i}".encode()).hexdigest()[:16]
            tokens = re.findall(r"\w+", piece.lower())
            chunks.append(Chunk(
                id=cid,
                source=source,
                path=path,
                title=title,
                content=piece,
                tokens=tokens,
            ))
            i += CHUNK_SIZE - CHUNK_OVERLAP
        return chunks

    def build(self):
        print("[indexer] Loading knowledge sources...")
        all_chunks: List[Chunk] = []
        for source_name, root in KNOWLEDGE_SOURCES:
            print(f"  → {source_name} ({root})")
            files = self._read_markdown_files(root, source_name)
            print(f"    {len(files)} markdown files")
            for path, content in files:
                all_chunks.extend(self._chunk_text(content, source_name, path))

        print(f"[indexer] Total chunks: {len(all_chunks)}")
        if not all_chunks:
            print("[indexer] No chunks built. Did you clone the knowledge bases?")
            return

        with open(self.chunks_path, "wb") as f:
            pickle.dump(all_chunks, f)
        print(f"[indexer] Saved chunks → {self.chunks_path}")

        if BM25Okapi is None:
            print("[indexer] rank_bm25 not installed; skipping BM25.")
        else:
            print("[indexer] Building BM25...")
            corpus = [c.tokens for c in all_chunks]
            bm25 = BM25Okapi(corpus)
            with open(self.bm25_path, "wb") as f:
                pickle.dump(bm25, f)
            print(f"[indexer] Saved BM25 → {self.bm25_path}")

        if SentenceTransformer is None or chromadb is None:
            print("[indexer] sentence-transformers/chromadb not installed; skipping embeddings.")
            return

        print(f"[indexer] Building embeddings ({EMBED_MODEL})...")
        model = SentenceTransformer(EMBED_MODEL)
        client = chromadb.PersistentClient(path=self.chroma_path)
        try:
            client.delete_collection("guardian")
        except Exception:
            pass
        coll = client.create_collection("guardian", metadata={"hnsw:space": "cosine"})

        batch = 256
        for i in range(0, len(all_chunks), batch):
            slice_ = all_chunks[i:i + batch]
            texts = [c.content for c in slice_]
            embs = model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
            coll.add(
                ids=[c.id for c in slice_],
                embeddings=embs.tolist(),
                metadatas=[{"source": c.source, "path": c.path, "title": c.title} for c in slice_],
                documents=texts,
            )
            print(f"  embedded {min(i + batch, len(all_chunks))}/{len(all_chunks)}")
        print(f"[indexer] Saved embeddings → {self.chroma_path}")
        print("[indexer] Done.")


# ── Retrieval ──────────────────────────────────────────────────────────────────────
class LocalRAG:
    def __init__(self, index_dir: str = INDEX_DIR):
        self.index_dir = index_dir
        self.chunks: List[Chunk] = []
        self.bm25 = None
        self.embed_model = None
        self.coll = None
        self._load()

    def _load(self):
        chunks_path = os.path.join(self.index_dir, "chunks.pkl")
        bm25_path = os.path.join(self.index_dir, "bm25.pkl")
        chroma_path = os.path.join(self.index_dir, "chroma")

        if os.path.exists(chunks_path):
            with open(chunks_path, "rb") as f:
                self.chunks = pickle.load(f)

        if os.path.exists(bm25_path) and BM25Okapi is not None:
            with open(bm25_path, "rb") as f:
                self.bm25 = pickle.load(f)

        if os.path.isdir(chroma_path) and SentenceTransformer is not None and chromadb is not None:
            try:
                self.embed_model = SentenceTransformer(EMBED_MODEL)
                client = chromadb.PersistentClient(path=chroma_path)
                self.coll = client.get_collection("guardian")
            except Exception as e:
                print(f"[rag] embedding load failed: {e}")

    @property
    def ready(self) -> bool:
        return bool(self.chunks)

    def stats(self) -> Dict:
        return {
            "chunks": len(self.chunks),
            "bm25": self.bm25 is not None,
            "embeddings": self.coll is not None,
            "sources": sorted({c.source for c in self.chunks}),
        }

    def _bm25_search(self, query: str, k: int) -> List[Tuple[Chunk, float]]:
        if not self.bm25:
            return []
        tokens = re.findall(r"\w+", query.lower())
        scores = self.bm25.get_scores(tokens)
        top_idx = sorted(range(len(scores)), key=lambda i: -scores[i])[:k]
        return [(self.chunks[i], float(scores[i])) for i in top_idx if scores[i] > 0]

    def _vector_search(self, query: str, k: int) -> List[Tuple[Chunk, float]]:
        if self.coll is None or self.embed_model is None:
            return []
        emb = self.embed_model.encode([query], normalize_embeddings=True).tolist()
        res = self.coll.query(query_embeddings=emb, n_results=k)
        out = []
        ids = res["ids"][0]
        dists = res["distances"][0]
        index_by_id = {c.id: c for c in self.chunks}
        for cid, dist in zip(ids, dists):
            ch = index_by_id.get(cid)
            if ch:
                out.append((ch, 1.0 - float(dist)))
        return out

    def search(self, query: str, k: int = 5) -> List[Chunk]:
        if not self.ready:
            return []
        bm25_hits = self._bm25_search(query, k * 2)
        vec_hits = self._vector_search(query, k * 2)

        rrf: Dict[str, float] = {}
        chunk_by_id: Dict[str, Chunk] = {}
        for rank, (ch, _) in enumerate(bm25_hits):
            rrf[ch.id] = rrf.get(ch.id, 0) + 1 / (60 + rank)
            chunk_by_id[ch.id] = ch
        for rank, (ch, _) in enumerate(vec_hits):
            rrf[ch.id] = rrf.get(ch.id, 0) + 1 / (60 + rank)
            chunk_by_id[ch.id] = ch

        ranked = sorted(rrf.items(), key=lambda kv: -kv[1])[:k]
        return [chunk_by_id[cid] for cid, _ in ranked]

    def context(self, query: str, k: int = 5, max_chars: int = 4000) -> str:
        chunks = self.search(query, k)
        if not chunks:
            return ""
        parts = []
        used = 0
        for ch in chunks:
            block = f"[{ch.source}:{ch.title}]\n{ch.content}"
            if used + len(block) > max_chars:
                break
            parts.append(block)
            used += len(block)
        return "\n\n---\n\n".join(parts)

    def for_vector(self, vuln: str, target_info: Optional[Dict] = None, k: int = 5) -> str:
        base = VULN_QUERIES.get(vuln, vuln)
        if target_info:
            tech = target_info.get("server", "") or target_info.get("powered_by", "")
            if tech:
                base = f"{base} {tech}"
        return self.context(base, k=k)


_pickle_shim()


# ── CLI ────────────────────────────────────────────────────────────────────────────
def main():
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--index", action="store_true", help="(Re)build the index")
    p.add_argument("--stats", action="store_true", help="Show index stats")
    p.add_argument("--query", type=str, help="Run a search")
    p.add_argument("-k", type=int, default=5)
    args = p.parse_args()

    if args.index:
        LocalIndexer().build()
        return

    rag = LocalRAG()
    if args.stats:
        print(json.dumps(rag.stats(), indent=2))
        return

    if args.query:
        results = rag.search(args.query, k=args.k)
        for ch in results:
            print(f"\n── [{ch.source}] {ch.title} ──")
            print(f"   {ch.path}")
            print(ch.content[:400])
        return

    p.print_help()


if __name__ == "__main__":
    main()
