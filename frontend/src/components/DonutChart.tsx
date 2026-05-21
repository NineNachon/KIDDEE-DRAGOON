"use client";

import { useState, useMemo } from "react";
import { Icons } from "./icons";
import type { VehicleDetection, Lang } from "@/types";

function p2c(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSeg(cx: number, cy: number, R: number, ri: number, s0: number, e0: number) {
  const gap = Math.min(2, (e0 - s0) * 0.05);
  const s = s0 + gap, e = e0 - gap;
  if (e <= s) return "";
  const os = p2c(cx, cy, R, s), oe = p2c(cx, cy, R, e);
  const is_ = p2c(cx, cy, ri, s), ie = p2c(cx, cy, ri, e);
  const lg = (e - s) > 180 ? 1 : 0;
  return `M${os.x.toFixed(2)} ${os.y.toFixed(2)} A${R} ${R} 0 ${lg} 1 ${oe.x.toFixed(2)} ${oe.y.toFixed(2)} L${ie.x.toFixed(2)} ${ie.y.toFixed(2)} A${ri} ${ri} 0 ${lg} 0 ${is_.x.toFixed(2)} ${is_.y.toFixed(2)}Z`;
}

interface Props {
  entries: VehicleDetection[];
  dark: boolean;
  lang: Lang;
}

export function DonutChart({ entries, dark, lang }: Props) {
  const [hov, setHov] = useState<string | null>(null);

  const data = useMemo(() => {
    const c: Record<string, { count: number; hex: string }> = {};
    entries.forEach(e => {
      if (!c[e.colorLabel]) c[e.colorLabel] = { count: 0, hex: e.colorHex };
      c[e.colorLabel].count++;
    });
    return Object.entries(c).sort((a, b) => b[1].count - a[1].count).map(([label, d]) => ({
      label, count: d.count, hex: d.hex, pct: d.count / (entries.length || 1),
    }));
  }, [entries]);

  const total = entries.length || 1;
  const cx = 100, cy = 100, R = 82, ri = 54;
  let cur = 0;
  const segs = data.map(d => {
    const sw = (d.count / total) * 360;
    const seg = { ...d, s: cur, e: cur + sw };
    cur += sw;
    return seg;
  });

  const hovSeg = segs.find(s => s.label === hov);
  const textFill = dark ? "#E2E8F0" : "#1a1d23";
  const subFill = dark ? "#64748b" : "#6b7280";

  return (
    <div className="card card-accent fade-up rounded-2xl p-5 shadow-[var(--shadow)]" style={{ animationDelay: "150ms" }}>
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--purple-bg)] text-[var(--purple)]">
          {Icons.palette}
        </div>
        <div>
          <div className="text-[14.5px] font-bold text-[var(--text)]">
            {lang === "en" ? "Vehicle Color Distribution" : "สัดส่วนสีของรถที่เข้า-ออก"}
          </div>
          <div className="text-[11px] text-[var(--subtle)]">
            {lang === "en" ? "Breakdown by detected car color" : "แบ่งตามสีรถที่ตรวจจับได้"}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-6 min-[560px]:justify-start">
        <svg width={200} height={200} className="w-[min(200px,58vw)] shrink-0 overflow-visible">
          <defs>
            <filter id="donut-shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.08" />
            </filter>
          </defs>
          <g filter="url(#donut-shadow)">
            {segs.map(s => (
              <path key={s.label}
                d={donutSeg(cx, cy, R + (hov === s.label ? 8 : 0), ri, s.s, s.e)}
                fill={s.hex || "#ccc"}
                opacity={hov && hov !== s.label ? 0.25 : 1}
                className="cursor-pointer transition-all duration-300"
                style={{ filter: hov === s.label ? "brightness(1.15)" : "none" }}
                onMouseEnter={() => setHov(s.label)}
                onMouseLeave={() => setHov(null)}
              />
            ))}
          </g>
          {!hov ? (
            <>
              <text x={cx} y={cy - 2} textAnchor="middle" style={{ fontSize: 30, fontWeight: 800, fill: textFill, fontFamily: "Sarabun,sans-serif" }}>{total}</text>
              <text x={cx} y={cy + 16} textAnchor="middle" style={{ fontSize: 10, fill: subFill, fontFamily: "Sarabun,sans-serif" }}>
                {lang === "en" ? "total" : "คันทั้งหมด"}
              </text>
            </>
          ) : hovSeg ? (
            <>
              <text x={cx} y={cy - 2} textAnchor="middle" style={{ fontSize: 26, fontWeight: 800, fill: textFill, fontFamily: "Sarabun,sans-serif" }}>{(hovSeg.pct * 100).toFixed(1)}%</text>
              <text x={cx} y={cy + 15} textAnchor="middle" style={{ fontSize: 11, fill: subFill, fontFamily: "Sarabun,sans-serif" }}>{hovSeg.label} · {hovSeg.count}</text>
            </>
          ) : null}
        </svg>
        <div className="flex min-w-[190px] flex-1 flex-col gap-1">
          {segs.slice(0, 8).map(s => (
            <div key={s.label}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-all"
              style={{
                opacity: hov && hov !== s.label ? 0.3 : 1,
                background: hov === s.label ? "var(--surface2)" : "transparent",
              }}
              onMouseEnter={() => setHov(s.label)} onMouseLeave={() => setHov(null)}>
              <span className="h-3.5 w-3.5 shrink-0 rounded-md shadow-sm" style={{ background: s.hex }} />
              <span className="flex-1 text-[12.5px] font-medium text-[var(--text)]">{s.label}</span>
              <span className="font-mono text-[11.5px] font-semibold text-[var(--subtle)]">{(s.pct * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
