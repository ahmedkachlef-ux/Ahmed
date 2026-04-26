"use client";
export function Stars({ value = 4.5, size = 14 }: { value?: number; size?: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.25 && value - full < 0.75;
  const items = Array.from({ length: 5 }, (_, i) => {
    if (i < full) return "full";
    if (i === full && half) return "half";
    return "empty";
  });
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {items.map((s, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
          <defs>
            <linearGradient id={`g-${i}-${s}`} x1="0" x2="1">
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="50%" stopColor="rgba(148,163,184,.35)" />
            </linearGradient>
          </defs>
          <path
            fill={s === "full" ? "#f97316" : s === "half" ? `url(#g-${i}-${s})` : "rgba(148,163,184,.35)"}
            d="M12 2.5l3 6.4 7 .9-5.1 4.6 1.4 6.7L12 17.7 5.7 21l1.4-6.7L2 9.8l7-.9z"
          />
        </svg>
      ))}
      <span className="ms-1 text-xs font-semibold text-ink-700 dark:text-ink-200">{value.toFixed(1)}</span>
    </span>
  );
}
