"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FUNNY_AVATARS } from "./Avatar";

type Bubble = { id: number; x: number; y: number; emoji: string; size: number; bad?: boolean };

export function AvatarPopGame() {
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(20);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const idRef = useRef(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => {
      setTime(t => {
        if (t <= 1) { setRunning(false); return 0; }
        return t - 1;
      });
    }, 1000);
    const spawn = setInterval(() => {
      const box = boxRef.current?.getBoundingClientRect();
      if (!box) return;
      const bad = Math.random() < 0.18;
      const a = FUNNY_AVATARS[Math.floor(Math.random() * FUNNY_AVATARS.length)];
      const size = 40 + Math.floor(Math.random() * 28);
      idRef.current += 1;
      const b: Bubble = {
        id: idRef.current,
        x: Math.random() * (box.width - size - 8) + 4,
        y: Math.random() * (box.height - size - 8) + 4,
        emoji: bad ? "💣" : a.emoji,
        size,
        bad
      };
      setBubbles(s => [...s.slice(-12), b]);
      setTimeout(() => setBubbles(s => s.filter(x => x.id !== b.id)), 1700);
    }, 380);
    return () => { clearInterval(tick); clearInterval(spawn); };
  }, [running]);

  function start() {
    setScore(0); setTime(20); setBubbles([]); setRunning(true);
  }

  function pop(b: Bubble) {
    if (b.bad) {
      setScore(s => Math.max(0, s - 3));
    } else {
      setScore(s => s + 1);
    }
    setBubbles(s => s.filter(x => x.id !== b.id));
  }

  return (
    <div className="card p-5 overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-display font-bold text-lg">Avatar Pop</div>
          <p className="text-sm text-ink-500">Tap avatars to score. Avoid the 💣</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="chip-brand">⭐ {score}</div>
          <div className="chip-muted">⏱ {time}s</div>
          <button onClick={start} className="btn btn-primary !py-1.5 text-xs">{running ? "Restart" : "Play"}</button>
        </div>
      </div>
      <div ref={boxRef} className="relative mt-4 h-64 rounded-xl bg-gradient-to-br from-brand-50 to-amber-50 dark:from-ink-800 dark:to-ink-900 border border-ink-100 dark:border-ink-700 overflow-hidden">
        <div className="absolute inset-0 hero-grid opacity-50" />
        <AnimatePresence>
          {bubbles.map(b => (
            <motion.button
              key={b.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 14 }}
              onClick={() => pop(b)}
              className="absolute select-none rounded-full bg-white/80 dark:bg-ink-700 shadow-card flex items-center justify-center"
              style={{ left: b.x, top: b.y, width: b.size, height: b.size, fontSize: b.size * 0.55 }}
            >
              <span aria-hidden>{b.emoji}</span>
            </motion.button>
          ))}
        </AnimatePresence>
        {!running && time === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="font-display font-extrabold text-2xl">Final score: {score}</div>
              <button onClick={start} className="btn btn-primary mt-2">Play again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
