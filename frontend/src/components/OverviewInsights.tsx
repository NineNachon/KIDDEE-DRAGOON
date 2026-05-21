"use client";

import { useMemo } from "react";
import { useCountUp } from "@/hooks/useCountUp";
import { Icons, TYPE_ICON } from "./icons";
import { TYPE_COLORS, TYPE_BG, pad2 } from "@/lib/constants";
import type { VehicleDetection, AdvancedEvent, Lang } from "@/types";

interface Props {
  entries: VehicleDetection[];
  advancedEvents: AdvancedEvent[];
  lang: Lang;
}

/* ── Hero: Total Vehicles ───────────────────────────────── */
function HeroTotal({ total, lang }: { total: number; lang: Lang }) {
  const counted = useCountUp(total, 1200);
  const th = lang === "th";

  return (
    <div className="overview-hero card card-accent fade-up rounded-2xl p-6 shadow-[var(--shadow)]">
      <div className="flex items-center gap-5">
        <div className="hero-icon-wrap flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg">
          <span className="text-[#FFD300]">{Icons.car}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-[var(--subtle)]">
            {th ? "รวมยานพาหนะที่ตรวจจับ" : "All Detected Vehicles"}
          </div>
          <div className="hero-number mt-1 leading-none">
            {counted.toLocaleString()}
          </div>
          <div className="mt-1.5 text-[12px] text-[var(--subtle)]">
            {th ? "คันทั้งหมด" : "total vehicles"}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Insight Card ───────────────────────────────────────── */
function InsightCard({
  icon, iconBg, iconColor, iconShadow,
  label, value, detail, accent, tag,
  delay,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  iconShadow?: string;
  label: string;
  value: string;
  detail: string;
  accent: string;
  tag?: React.ReactNode;
  delay: number;
}) {
  return (
    <div
      className="card card-accent fade-up rounded-2xl p-5 shadow-[var(--shadow)] flex flex-col"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: iconBg, color: iconColor, boxShadow: iconShadow || "none" }}
        >
          {icon}
        </div>
        {tag}
      </div>
      <div className="mt-4 text-[12px] font-semibold text-[var(--subtle)]">{label}</div>
      <div className="mt-1.5 text-[24px] font-extrabold leading-tight" style={{ color: accent }}>
        {value}
      </div>
      <div className="mt-auto pt-3 text-[12px] font-medium text-[var(--subtle)]">{detail}</div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────── */
export function OverviewInsights({ entries, advancedEvents, lang }: Props) {
  const insights = useMemo(() => {
    const total = entries.length || 1;

    const colorCounts: Record<string, { count: number; hex: string }> = {};
    entries.forEach(e => {
      if (!colorCounts[e.colorLabel]) colorCounts[e.colorLabel] = { count: 0, hex: e.colorHex };
      colorCounts[e.colorLabel].count++;
    });
    const topColor = Object.entries(colorCounts).sort((a, b) => b[1].count - a[1].count)[0];

    const hourCounts: Record<number, number> = {};
    entries.forEach(e => {
      const d = new Date(e.timestamp);
      if (!isNaN(d.getTime())) hourCounts[d.getHours()] = (hourCounts[d.getHours()] || 0) + 1;
    });
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

    const brandCounts: Record<string, number> = {};
    entries.forEach(e => { brandCounts[e.brand] = (brandCounts[e.brand] || 0) + 1; });
    const topBrand = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])[0];

    const typeCounts: Record<string, number> = {};
    entries.forEach(e => { typeCounts[e.vehicleType] = (typeCounts[e.vehicleType] || 0) + 1; });
    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

    const eventTotal = advancedEvents.length;
    const eventBySeverity: Record<string, number> = {};
    advancedEvents.forEach(ev => { eventBySeverity[ev.severity] = (eventBySeverity[ev.severity] || 0) + 1; });

    return { total, topColor, peakHour, topBrand, topType, eventTotal, eventBySeverity };
  }, [entries, advancedEvents]);

  const th = lang === "th";

  const peakHourLabel = insights.peakHour
    ? (() => {
        const h = parseInt(insights.peakHour[0]);
        return `${pad2(h)}:00 - ${pad2((h + 1) % 24)}:00`;
      })()
    : "--:-- - --:--";

  return (
    <div className="insights-grid">
      {/* ── Total Vehicles ───────────────────────────── */}
      <HeroTotal total={entries.length} lang={lang} />

      {/* ── Top Color ───────────────────────────────── */}
        <InsightCard
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="13.5" cy="6.5" r="1.5" /><circle cx="17.5" cy="10.5" r="1.5" /><circle cx="8.5" cy="7.5" r="1.5" /><circle cx="6.5" cy="12.5" r="1.5" /><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-0.9 2-2 0-0.6-0.3-1.1-0.7-1.5-0.4-0.4-0.7-0.9-0.7-1.5 0-1.1 0.9-2 2-2H16c3.3 0 6-2.7 6-6 0-4.4-4.5-8-10-8z" />
            </svg>
          }
          iconBg="var(--purple-bg)"
          iconColor="var(--purple)"
          label={th ? "สีรถยอดนิยม" : "Top Vehicle Color"}
          value={insights.topColor ? `${((insights.topColor[1].count / insights.total) * 100).toFixed(1)}%` : "-"}
          detail={
            insights.topColor
              ? `${insights.topColor[0]} — ${insights.topColor[1].count.toLocaleString()} ${th ? "คัน" : "vehicles"}`
              : (th ? "ยังไม่มีข้อมูล" : "No data yet")
          }
          accent={insights.topColor?.[1].hex || "var(--purple)"}
          tag={
            insights.topColor
              ? <span className="h-6 w-6 shrink-0 rounded-lg shadow-sm border border-white/30" style={{ background: insights.topColor[1].hex }} />
              : undefined
          }
          delay={100}
        />

        {/* ── Peak Hour ───────────────────────────────── */}
        <InsightCard
          icon={<span style={{ color: "var(--blue)" }}>{Icons.chart}</span>}
          iconBg="var(--blue-bg)"
          iconColor="var(--blue)"
          label={th ? "ช่วงเวลาคับคั่งที่สุด" : "Peak Hour"}
          value={peakHourLabel}
          detail={
            insights.peakHour
              ? `${insights.peakHour[1].toLocaleString()} ${th ? "คัน" : "vehicles"}`
              : (th ? "ยังไม่มีข้อมูล" : "No data yet")
          }
          accent="var(--blue)"
          delay={150}
        />

        {/* ── Top Brand ───────────────────────────────── */}
        <InsightCard
          icon={<span style={{ color: "var(--yellow-dark)" }}>{Icons.trophy}</span>}
          iconBg="rgba(255,211,0,0.12)"
          iconColor="var(--yellow-dark)"
          iconShadow="0 4px 12px rgba(255,211,0,0.18)"
          label={th ? "ยี่ห้อรถยนต์ยอดนิยม" : "Top Vehicle Brand"}
          value={insights.topBrand ? `${((insights.topBrand[1] / insights.total) * 100).toFixed(1)}%` : "-"}
          detail={
            insights.topBrand
              ? `${insights.topBrand[0]} — ${insights.topBrand[1].toLocaleString()} ${th ? "คัน" : "vehicles"}`
              : (th ? "ยังไม่มีข้อมูล" : "No data yet")
          }
          accent="var(--yellow-dark)"
          delay={200}
        />

        {/* ── Top Vehicle Type ────────────────────────── */}
        <InsightCard
          icon={
            insights.topType
              ? <span style={{ color: TYPE_COLORS[insights.topType[0]] || "var(--green)" }}>
                  {TYPE_ICON[insights.topType[0]] || Icons.car}
                </span>
              : <span style={{ color: "var(--green)" }}>{Icons.car}</span>
          }
          iconBg={insights.topType ? TYPE_BG[insights.topType[0]] || "var(--green-bg)" : "var(--green-bg)"}
          iconColor={insights.topType ? TYPE_COLORS[insights.topType[0]] || "var(--green)" : "var(--green)"}
          label={th ? "ประเภทยานพาหนะที่พบมากที่สุด" : "Top Vehicle Type"}
          value={insights.topType ? `${((insights.topType[1] / insights.total) * 100).toFixed(1)}%` : "-"}
          detail={
            insights.topType
              ? `${insights.topType[0]} — ${insights.topType[1].toLocaleString()} ${th ? "คัน" : "vehicles"}`
              : (th ? "ยังไม่มีข้อมูล" : "No data yet")
          }
          accent={insights.topType ? TYPE_COLORS[insights.topType[0]] || "var(--green)" : "var(--green)"}
          delay={250}
        />

        {/* ── Events Summary ──────────────────────────── */}
        <InsightCard
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
          iconBg="var(--red-bg)"
          iconColor="var(--red)"
          label={th ? "เหตุการณ์ที่ตรวจจับ" : "Detected Events"}
          value={`${insights.eventTotal}`}
          detail={
            insights.eventTotal > 0
              ? [
                  insights.eventBySeverity["critical"] && `${th ? "วิกฤต" : "Critical"}: ${insights.eventBySeverity["critical"]}`,
                  insights.eventBySeverity["high"] && `${th ? "สูง" : "High"}: ${insights.eventBySeverity["high"]}`,
                  insights.eventBySeverity["medium"] && `${th ? "ปานกลาง" : "Medium"}: ${insights.eventBySeverity["medium"]}`,
                  insights.eventBySeverity["low"] && `${th ? "ต่ำ" : "Low"}: ${insights.eventBySeverity["low"]}`,
                ].filter(Boolean).join(" · ")
              : (th ? "ยังไม่พบเหตุการณ์ผิดปกติ" : "No anomalous events detected")
          }
          accent={insights.eventBySeverity["critical"] ? "var(--red)" : insights.eventBySeverity["high"] ? "#f59e0b" : "var(--green)"}
          delay={300}
        />
      </div>
  );
}
