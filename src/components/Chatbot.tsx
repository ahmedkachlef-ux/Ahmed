"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type Msg = { role: "user" | "assistant"; content: string; recos?: { slug: string; title: string }[] };

export function Chatbot({ assistantName = "Alexa" }: { assistantName?: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: `Hi! I'm ${assistantName}. Tell me your goals — I'll recommend the perfect ADVANCIA training.` }
  ]);
  const [loading, setLoading] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => { scroller.current?.scrollTo({ top: 9e9 }); }, [messages, open]);

  async function send() {
    if (!text.trim()) return;
    const next = [...messages, { role: "user" as const, content: text.trim() }];
    setMessages(next); setText(""); setLoading(true);
    const r = await fetch("/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: next.map(m => ({ role: m.role, content: m.content })) })
    });
    const j = await r.json();
    setLoading(false);
    setMessages([...next, { role: "assistant", content: j.reply, recos: j.recommendations?.map((x: any) => ({ slug: x.slug, title: x.title })) }]);
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-white shadow-glow hover:scale-105 transition"
        aria-label="Open assistant"
      >
        <span className="text-2xl">💬</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
            className="fixed bottom-24 right-5 z-50 w-[360px] max-w-[92vw] card overflow-hidden">
            <div className="p-3 flex items-center justify-between border-b border-ink-100 dark:border-ink-800">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-brand-gradient text-white inline-flex items-center justify-center font-bold">{assistantName[0]}</span>
                <div>
                  <div className="text-sm font-display font-bold leading-none">{assistantName}</div>
                  <div className="text-[11px] text-ink-500">ADVANCIA AI assistant</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-ink-500 hover:text-brand-600">✕</button>
            </div>
            <div ref={scroller} className="h-80 overflow-y-auto p-3 space-y-2 bg-[rgb(var(--bg))]">
              {messages.map((m, i) => (
                <div key={i} className={`max-w-[85%] ${m.role === "user" ? "ml-auto" : ""}`}>
                  <div className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user" ? "bg-brand-gradient text-white rounded-br-sm" : "card !shadow-none"}`}>
                    {m.content}
                  </div>
                  {m.recos && m.recos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.recos.slice(0, 3).map(r => (
                        <Link key={r.slug} href={`/trainings/${r.slug}`} className="chip-brand hover:brightness-110">{r.title}</Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {loading && <div className="text-xs text-ink-500">Thinking…</div>}
            </div>
            <div className="p-2 border-t border-ink-100 dark:border-ink-800 flex gap-2">
              <input className="input" placeholder="Ask anything…" value={text}
                onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
              <button onClick={send} className="btn btn-primary !py-2 !px-3 text-sm">Send</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
