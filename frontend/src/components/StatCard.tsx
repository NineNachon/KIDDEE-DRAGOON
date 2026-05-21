"use client";

import { useCountUp } from "@/hooks/useCountUp";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  value: number;
  trend?: number;
  trendLabel?: string;
  color: string;
  bgColor: string;
  delay?: number;
}

export function StatCard({ icon, label, sublabel, value, trend, trendLabel, color, bgColor, delay = 0 }: StatCardProps) {
  const counted = useCountUp(value, 1000);
  const pos = (trend ?? 0) >= 0;

  return (
    <div className="card card-accent fade-up relative flex min-h-[168px] flex-col justify-between gap-4 overflow-hidden rounded-2xl p-5 shadow-[var(--shadow)]"
      style={{ animationDelay: `${delay}ms` }}>
      {/* Decorative gradient blob */}
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-[0.15]"
        style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }} />

      <div className="relative flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-[15px] shadow-sm"
          style={{ background: bgColor, color, boxShadow: `0 4px 14px ${bgColor}` }}>
          {icon}
        </div>
        {trendLabel && trend !== undefined && (
          <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold"
            style={{ background: pos ? "var(--green-bg)" : "var(--red-bg)", color: pos ? "#16a34a" : "#dc2626" }}>
            {pos ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>

      <div className="relative">
        <div className="text-[clamp(32px,2.7vw,42px)] font-extrabold leading-none text-[var(--text)]"
          style={{ fontVariantNumeric: "tabular-nums" }}>
          {counted.toLocaleString()}
        </div>
        <div className="mt-2 text-[13.5px] font-semibold leading-tight text-[var(--text)]">{label}</div>
        {sublabel && <div className="mt-1 text-[11.5px] text-[var(--subtle)]">{sublabel}</div>}
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full opacity-30" style={{ background: color }} />
    </div>
  );
}
