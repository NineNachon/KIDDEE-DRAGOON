"use client";

import { useMemo } from "react";
import { Icons } from "./icons";
import { TYPE_ICON } from "./icons";
import { TYPE_COLORS, TYPE_BG } from "@/lib/constants";
import type { VehicleDetection, Lang } from "@/types";

interface Props {
  entries: VehicleDetection[];
  lang: Lang;
}

export function TypeDistribution({ entries, lang }: Props) {
  const data = useMemo(() => {
    const c: Record<string, number> = {};
    entries.forEach(e => { c[e.vehicleType] = (c[e.vehicleType] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const total = entries.length || 1;

  return (
    <div className="card card-accent fade-up rounded-2xl p-6 shadow-[var(--shadow)]" style={{ animationDelay: "250ms" }}>
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--green-bg)] text-[var(--green)]">
          {Icons.car}
        </div>
        <div>
          <div className="text-[14.5px] font-bold text-[var(--text)]">
            {lang === "en" ? "Vehicle Type Distribution" : "สัดส่วนประเภทยานพาหนะ"}
          </div>
          <div className="text-[11px] text-[var(--subtle)]">
            {lang === "en" ? "Detected by category" : "ตรวจจับแยกตามประเภท"}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {data.map(([type, cnt]) => {
          const pct = (cnt / total) * 100;
          const color = TYPE_COLORS[type] || "#6b7280";
          const bg = TYPE_BG[type] || "var(--surface2)";
          return (
            <div key={type}
              className="group flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all hover:shadow-md"
              style={{ background: bg }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface)] shadow-sm" style={{ color }}>
                {TYPE_ICON[type] || Icons.car}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex justify-between">
                  <span className="text-[13px] font-bold text-[var(--text)]">{type}</span>
                  <span className="font-mono text-[13px] font-bold" style={{ color }}>{cnt.toLocaleString()}</span>
                </div>
                <div className="h-[6px] overflow-hidden rounded-full bg-[var(--border)]">
                  <div className="h-full rounded-full transition-all duration-700 group-hover:brightness-110" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
              <span className="min-w-[48px] text-right text-[15px] font-extrabold" style={{ color }}>{pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
