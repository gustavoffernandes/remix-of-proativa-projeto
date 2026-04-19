import { useEffect, useState } from "react";

const TARGET = new Date("2026-05-26T00:00:00-03:00").getTime();

function diff() {
  const now = Date.now();
  const ms = Math.max(0, TARGET - now);
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

export function Countdown() {
  const [t, setT] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  useEffect(() => {
    setT(diff());
    const id = setInterval(() => setT(diff()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!t) {
    return (
      <div
        className="inline-flex items-center gap-4 sm:gap-6 rounded-2xl border border-border bg-card px-5 py-3 shadow-[var(--shadow-soft)]"
        aria-hidden
      >
        <span className="font-display text-2xl sm:text-3xl tabular-nums text-foreground/40">
          --:--:--
        </span>
      </div>
    );
  }

  const Item = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <span className="font-display text-2xl sm:text-3xl tabular-nums text-foreground">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
        {label}
      </span>
    </div>
  );

  return (
    <div className="inline-flex items-center gap-4 sm:gap-6 rounded-2xl border border-border bg-card px-5 py-3 shadow-[var(--shadow-soft)]">
      <Item value={t.days} label="dias" />
      <span className="text-muted-foreground/40">:</span>
      <Item value={t.hours} label="hrs" />
      <span className="text-muted-foreground/40">:</span>
      <Item value={t.minutes} label="min" />
      <span className="text-muted-foreground/40 hidden sm:inline">:</span>
      <div className="hidden sm:block">
        <Item value={t.seconds} label="seg" />
      </div>
    </div>
  );
}
