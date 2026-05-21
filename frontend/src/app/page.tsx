"use client";

import { useState, useEffect, useMemo } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { NavBar } from "@/components/NavBar";
import { StatCard } from "@/components/StatCard";
import { DonutChart } from "@/components/DonutChart";
import { TrendChart } from "@/components/TrendChart";
import { TopBrandsCard } from "@/components/TopBrandsCard";
import { TypeDistribution } from "@/components/TypeDistribution";
import { DataTable } from "@/components/DataTable";
import { AccidentAlert } from "@/components/AccidentAlert";
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio } from "@/components/TweaksPanel";
import { OverviewInsights } from "@/components/OverviewInsights";
import { ChatBot } from "@/components/ChatBot";
import { Icons, TYPE_ICON } from "@/components/icons";
import { detectionKey, eventDetectionKey, eventTypeLabel } from "@/lib/advancedEvents";
import { TYPE_COLORS, TYPE_BG, LIVE_SPEED_MS } from "@/lib/constants";
import type { AdvancedEvent, VehicleDetection, Lang, LiveSpeed, FilterOption } from "@/types";

const MAX_ENTRIES = 5000;

function plateProvince(plate?: string): string | null {
  if (!plate) return null;
  const parts = plate.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : null;
}

function sameOriginApiUrl() {
  return typeof window === "undefined" ? "" : window.location.origin;
}

function sameOriginWsUrl() {
  if (typeof window === "undefined") return "";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/stream`;
}

export default function DashboardPage() {
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState<Lang>("th");
  const [liveSpeed, setLiveSpeed] = useState<LiveSpeed>("normal");
  const [entries, setEntries] = useState<VehicleDetection[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [colorFilter, setColorFilter] = useState<string[]>([]);
  const [modelFilter, setModelFilter] = useState<string[]>([]);
  const [plateFilter, setPlateFilter] = useState<string[]>([]);
  const [eventFilter, setEventFilter] = useState<string[]>([]);
  const [advancedEvents, setAdvancedEvents] = useState<AdvancedEvent[]>([]);
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || sameOriginWsUrl();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || sameOriginApiUrl();
  const { isConnected, lastMessage, send } = useWebSocket(wsUrl);

  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === "history" && Array.isArray(lastMessage.data)) {
      setEntries(lastMessage.data);
    } else if (lastMessage.type === "detection" && lastMessage.data) {
      setEntries(prev => [lastMessage.data, ...prev].slice(0, MAX_ENTRIES));
    }
  }, [lastMessage]);

  useEffect(() => {
    send({ action: "set_delay", delay_ms: LIVE_SPEED_MS[liveSpeed] });
  }, [liveSpeed, send]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    let cancelled = false;
    const loadEvents = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/advanced-events`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.events)) setAdvancedEvents(data.events);
      } catch {
        if (!cancelled) setAdvancedEvents([]);
      }
    };
    loadEvents();
    const t = setInterval(loadEvents, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [apiUrl]);

  const eventByDetectionKey = useMemo(() => {
    const map = new Map<string, AdvancedEvent[]>();
    advancedEvents.forEach(event => {
      const key = eventDetectionKey(event);
      if (!key) return;
      const list = map.get(key) || [];
      list.push(event);
      map.set(key, list);
    });
    return map;
  }, [advancedEvents]);

  const filtered = useMemo(() => {
    let result = entries;
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(e =>
        e.brand.toLowerCase().includes(q) ||
        e.colorLabel.toLowerCase().includes(q) ||
        e.vehicleType.toLowerCase().includes(q) ||
        (e.vehicleModel || "").toLowerCase().includes(q) ||
        (e.licensePlate || "").toLowerCase().includes(q) ||
        (e.cameraId || "").toLowerCase().includes(q) ||
        (e.trackId || "").toLowerCase().includes(q) ||
        e.timestamp.includes(q)
      );
    }
    if (typeFilter.length > 0) result = result.filter(e => typeFilter.includes(e.vehicleType));
    if (brandFilter.length > 0) result = result.filter(e => brandFilter.includes(e.brand));
    if (colorFilter.length > 0) result = result.filter(e => colorFilter.includes(e.colorLabel));
    if (modelFilter.length > 0) result = result.filter(e => e.vehicleModel && modelFilter.includes(e.vehicleModel));
    if (plateFilter.length > 0) result = result.filter(e => {
      const province = plateProvince(e.licensePlate);
      return province ? plateFilter.includes(province) : false;
    });
    if (eventFilter.length > 0) {
      result = result.filter(e => {
        const events = eventByDetectionKey.get(detectionKey(e)) || [];
        return events.some(event => eventFilter.includes(event.type));
      });
    }
    if (timeStart) result = result.filter(e => e.timestamp >= timeStart.replace("T", " "));
    if (timeEnd) result = result.filter(e => e.timestamp <= timeEnd.replace("T", " ") + ":59");
    return result;
  }, [entries, search, typeFilter, brandFilter, colorFilter, modelFilter, plateFilter, eventFilter, eventByDetectionKey, timeStart, timeEnd]);

  const typeOptions = useMemo<FilterOption[]>(() =>
    [...new Set(entries.map(e => e.vehicleType))].sort().map(t => ({ value: t, label: t })),
    [entries]);

  const brandOptions = useMemo<FilterOption[]>(() =>
    [...new Set(entries.map(e => e.brand))].sort().map(b => ({ value: b, label: b })),
    [entries]);

  const colorOptions = useMemo<FilterOption[]>(() =>
    [...new Set(entries.map(e => e.colorLabel))].sort().map(c => {
      const hex = entries.find(e => e.colorLabel === c)?.colorHex || "#888";
      return { value: c, label: c, hex };
    }),
    [entries]);

  const modelOptions = useMemo<FilterOption[]>(() =>
    [...new Set(entries.map(e => e.vehicleModel).filter(Boolean) as string[])].sort().map(m => ({ value: m, label: m })),
    [entries]);

  const plateOptions = useMemo<FilterOption[]>(() =>
    [...new Set(entries.map(e => plateProvince(e.licensePlate)).filter(Boolean) as string[])].sort().map(p => ({ value: p, label: p })),
    [entries]);

  const eventOptions = useMemo<FilterOption[]>(() =>
    [...new Set(advancedEvents.map(e => e.type))].sort().map(t => ({ value: t, label: eventTypeLabel(t, lang) })),
    [advancedEvents, lang]);

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    entries.forEach(e => { c[e.vehicleType] = (c[e.vehicleType] || 0) + 1; });
    return c;
  }, [entries]);

  const typeKeys = Object.keys(TYPE_COLORS);

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: "var(--bg)" }}>
      <NavBar dark={dark} setDark={setDark} lang={lang} isConnected={isConnected} />
      <AccidentAlert events={advancedEvents} lang={lang} />

      <main className="dashboard-main flex flex-col gap-8">
        {/* ── Section: Overview ─────────────────────────── */}
        <section>
          <div className="section-title fade-up">
            {lang === "en" ? "Overview" : "ภาพรวม"}
          </div>
          <OverviewInsights entries={entries} advancedEvents={advancedEvents} lang={lang} />
        </section>

        {/* ── Section: Analytics ─────────────────────────────── */}
        <section>
          <div className="section-title fade-up" style={{ animationDelay: "100ms" }}>
            {lang === "en" ? "Analytics" : "วิเคราะห์ข้อมูล"}
          </div>
          <div className="analytics-grid">
            <DonutChart entries={entries} dark={dark} lang={lang} />
            <TrendChart entries={entries} dark={dark} lang={lang} />
          </div>
        </section>

        {/* ── Section: Rankings ──────────────────────────────── */}
        <section>
          <div className="section-title fade-up" style={{ animationDelay: "150ms" }}>
            {lang === "en" ? "Rankings" : "อันดับ"}
          </div>
          <div className="grid grid-cols-2 gap-[18px] max-[980px]:grid-cols-1">
            <TopBrandsCard entries={entries} lang={lang} />
            <TypeDistribution entries={entries} lang={lang} />
          </div>
        </section>

        {/* ── Section: Detection Log ─────────────────────────── */}
        <section>
          <DataTable
            rows={filtered} allRows={entries} search={search} setSearch={setSearch} lang={lang}
            typeFilter={typeFilter} setTypeFilter={setTypeFilter}
            brandFilter={brandFilter} setBrandFilter={setBrandFilter}
            colorFilter={colorFilter} setColorFilter={setColorFilter}
            modelFilter={modelFilter} setModelFilter={setModelFilter}
            plateFilter={plateFilter} setPlateFilter={setPlateFilter}
            eventFilter={eventFilter} setEventFilter={setEventFilter}
            timeStart={timeStart} setTimeStart={setTimeStart}
            timeEnd={timeEnd} setTimeEnd={setTimeEnd}
            typeOptions={typeOptions} brandOptions={brandOptions} colorOptions={colorOptions}
            modelOptions={modelOptions} plateOptions={plateOptions} eventOptions={eventOptions}
            eventByDetectionKey={eventByDetectionKey}
            getDetectionKey={detectionKey}
          />
        </section>
      </main>

      <TweaksPanel title="Settings">
        <TweakSection label="Display">
          <TweakToggle label="Dark Mode" value={dark} onChange={setDark} />
        </TweakSection>
        <TweakSection label="Live Feed">
          <TweakRadio label="Update Speed" value={liveSpeed} options={["slow", "normal", "fast"]} onChange={v => setLiveSpeed(v as LiveSpeed)} />
        </TweakSection>
      </TweaksPanel>

      <ChatBot lang={lang} />
    </div>
  );
}
