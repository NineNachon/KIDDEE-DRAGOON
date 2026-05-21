"use client";

import { useState, useMemo } from "react";
import { Icons } from "./icons";
import { pad2 } from "@/lib/constants";
import type { VehicleDetection, Lang } from "@/types";

interface Props {
  entries: VehicleDetection[];
  dark: boolean;
  lang: Lang;
}

export function TrendChart({ entries, dark, lang }: Props) {
  const hourly = useMemo(() => {
    const buckets: Record<string, number> = {};
    entries.forEach(e => {
      const d = new Date(e.timestamp);
      if (isNaN(d.getTime())) return;
      const hr = pad2(d.getHours()) + ":00";
      buckets[hr] = (buckets[hr] || 0) + 1;
    });
    return Object.entries(buckets).sort((a, b) => a[0].localeCompare(b[0])).map(([hour, count]) => ({ hour, count }));
  }, [entries]);

  const [hov, setHov] = useState<number | null>(null);
  const W = 480, H = 220, pad = { t: 34, r: 10, b: 30, l: 40 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const maxC = Math.max(...hourly.map(d => d.count), 1);

  const pts = hourly.map((d, i) => ({
    x: pad.l + (i / Math.max(hourly.length - 1, 1)) * iW,
    y: pad.t + iH - (d.count / maxC) * iH,
    ...d,
  }));

  const line = pts.map((p, i) => (i === 0 ? "M" : "L") + p.x.toFixed(1) + " " + p.y.toFixed(1)).join(" ");
  const area = line + ` L${pts[pts.length - 1]?.x.toFixed(1) ?? pad.l} ${pad.t + iH} L${pts[0]?.x.toFixed(1) ?? pad.l} ${pad.t + iH} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => pad.t + iH - f * iH);
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * maxC));
  const textFill = dark ? "#64748b" : "#9ca3af";

  if (hourly.length < 2) return null;

  return (
    <div className="card card-accent fade-up rounded-2xl p-5 shadow-[var(--shadow)]" style={{ animationDelay: "200ms" }}>
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--blue-bg)] text-[var(--blue)]">
          {Icons.chart}
        </div>
        <div>
          <div className="text-[14.5px] font-bold text-[var(--text)]">
            {lang === "en" ? "Hourly Vehicle Trend" : "แนวโน้มยานพาหนะรายชั่วโมง"}
          </div>
          <div className="text-[11px] text-[var(--subtle)]">
            {lang === "en" ? "Vehicle detections per hour" : "จำนวนยานพาหนะที่ตรวจจับต่อชั่วโมง"}
          </div>
        </div>
      </div>
      <div className="mt-5 min-h-[260px] overflow-visible">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full min-h-[220px] w-full overflow-visible">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {gridLines.map((y, i) => (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke={dark ? "#1e293b" : "#f0f0f0"} strokeWidth="1" />
            <text x={pad.l - 8} y={y + 4} textAnchor="end" style={{ fontSize: 9, fill: textFill, fontFamily: "JetBrains Mono, monospace" }}>{yLabels[i]}</text>
          </g>
        ))}
        <path d={area} fill="url(#areaGrad)" />
        <path d={line} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={hov === i ? 5 : 3}
            fill={hov === i ? "#3b82f6" : dark ? "#131a2b" : "#ffffff"}
            stroke="#3b82f6" strokeWidth="2" className="cursor-pointer transition-all"
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
        ))}
        {pts.filter((_, i) => i % Math.max(1, Math.floor(pts.length / 8)) === 0).map(p => (
          <text key={p.hour} x={p.x} y={H - 6} textAnchor="middle" style={{ fontSize: 9, fill: textFill, fontFamily: "JetBrains Mono, monospace" }}>{p.hour.slice(0, 2)}</text>
        ))}
        {hov != null && pts[hov] && (
          <g>
            <line x1={pts[hov].x} y1={pad.t} x2={pts[hov].x} y2={pad.t + iH} stroke={dark ? "#334155" : "#d1d5db"} strokeWidth="1" strokeDasharray="4 3" />
            <rect x={pts[hov].x - 30} y={Math.max(2, pts[hov].y - 30)} width="60" height="22" rx="6" fill={dark ? "#1e293b" : "#1a1d23"} />
            <text x={pts[hov].x} y={Math.max(17, pts[hov].y - 15)} textAnchor="middle" style={{ fontSize: 11, fontWeight: 700, fill: "#fff", fontFamily: "Sarabun,sans-serif" }}>{pts[hov].count}</text>
          </g>
        )}
      </svg>
      </div>
    </div>
  );
}
