"use client";

import { useMemo } from "react";
import { Icons } from "./icons";
import type { VehicleDetection, Lang } from "@/types";

interface Props {
  entries: VehicleDetection[];
  lang: Lang;
}

export function TopBrandsCard({ entries, lang }: Props) {
  const data = useMemo(() => {
    const c: Record<string, number> = {};
    entries.forEach(e => { c[e.brand] = (c[e.brand] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [entries]);

  const total = entries.length || 1;
  const max = data[0]?.[1] || 1;
  const palettes = ["linear-gradient(135deg,#FFD300,#FFAA00)", "linear-gradient(135deg,#94A3B8,#64748B)", "linear-gradient(135deg,#CBD5E1,#94A3B8)", "linear-gradient(135deg,#E2E8F0,#CBD5E1)", "linear-gradient(135deg,#F1F5F9,#E2E8F0)"];
  const medals = ["🥇", "🥈", "🥉", "4", "5"];

  return (
    <div className="card card-accent fade-up rounded-2xl p-6 shadow-[var(--shadow)]" style={{ animationDelay: "100ms" }}>
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(255,211,0,0.12)] text-[var(--yellow-dark)]">
          {Icons.trophy}
        </div>
        <div>
          <div className="text-[14.5px] font-bold text-[var(--text)]">
            {lang === "en" ? "Top Vehicle Brands" : "ยี่ห้อรถยนต์ยอดนิยม"}
          </div>
          <div className="text-[11px] text-[var(--subtle)]">
            {lang === "en" ? "Top 5 by detection count" : "อันดับ 5 ยี่ห้อที่พบมากที่สุด"}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-5">
        {data.map(([brand, cnt], i) => (
          <div key={brand} className="group">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-3 text-[13.5px] font-bold text-[var(--text)]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg text-sm"
                  style={{ background: i === 0 ? "linear-gradient(135deg,#FFD300,#FFAA00)" : "var(--surface2)", color: i === 0 ? "#1a1d23" : "var(--subtle)" }}>
                  {medals[i]}
                </span>
                {brand}
              </span>
              <div className="text-right">
                <span className="font-mono text-[14px] font-bold text-[var(--text)]">{cnt.toLocaleString()}</span>
                <span className="ml-1.5 text-[11px] text-[var(--subtle)]">{((cnt / total) * 100).toFixed(1)}%</span>
              </div>
            </div>
            <div className="h-[10px] overflow-hidden rounded-full bg-[var(--surface2)]">
              <div className="h-full rounded-full transition-all duration-700 group-hover:brightness-110"
                style={{ width: `${(cnt / max) * 100}%`, background: palettes[i] }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
