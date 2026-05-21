"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Icons } from "./icons";
import { FilterDropdown } from "./FilterDropdown";
import { eventTypeLabel, severityColor } from "@/lib/advancedEvents";
import { BADGE_STYLES, TYPE_BG, TYPE_COLORS, formatTimestamp } from "@/lib/constants";
import type { AdvancedEvent, VehicleDetection, Lang, FilterOption } from "@/types";

const PER_PAGE = 15;

function plateProvince(plate?: string): string | null {
  if (!plate) return null;
  const parts = plate.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : null;
}

interface Props {
  rows: VehicleDetection[];
  allRows: VehicleDetection[];
  search: string;
  setSearch: (v: string) => void;
  lang: Lang;
  typeFilter: string[];
  setTypeFilter: React.Dispatch<React.SetStateAction<string[]>>;
  brandFilter: string[];
  setBrandFilter: React.Dispatch<React.SetStateAction<string[]>>;
  colorFilter: string[];
  setColorFilter: React.Dispatch<React.SetStateAction<string[]>>;
  modelFilter: string[];
  setModelFilter: React.Dispatch<React.SetStateAction<string[]>>;
  plateFilter: string[];
  setPlateFilter: React.Dispatch<React.SetStateAction<string[]>>;
  eventFilter: string[];
  setEventFilter: React.Dispatch<React.SetStateAction<string[]>>;
  timeStart: string;
  setTimeStart: (v: string) => void;
  timeEnd: string;
  setTimeEnd: (v: string) => void;
  typeOptions: FilterOption[];
  brandOptions: FilterOption[];
  colorOptions: FilterOption[];
  modelOptions: FilterOption[];
  plateOptions: FilterOption[];
  eventOptions: FilterOption[];
  eventByDetectionKey: Map<string, AdvancedEvent[]>;
  getDetectionKey: (d: VehicleDetection) => string;
}

type SortKey = "timestamp" | "vehicleType" | "brand" | "vehicleModel" | "licensePlate" | "colorLabel";

export function DataTable({
  rows, allRows, search, setSearch, lang,
  typeFilter, setTypeFilter, brandFilter, setBrandFilter, colorFilter, setColorFilter,
  modelFilter, setModelFilter, plateFilter, setPlateFilter, eventFilter, setEventFilter,
  timeStart, setTimeStart, timeEnd, setTimeEnd,
  typeOptions, brandOptions, colorOptions, modelOptions, plateOptions, eventOptions,
  eventByDetectionKey, getDetectionKey,
}: Props) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const fileRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo(() =>
    [...rows].sort((a, b) => {
      const av = a[sortKey] || "";
      const bv = b[sortKey] || "";
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    }),
    [rows, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const pageRows = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => { setPage(1); }, [search, rows.length]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => sortKey !== k
    ? <span className="ml-1 text-[10px] opacity-50 text-[var(--subtle)]">⇅</span>
    : <span className="ml-1 text-[11px] text-[var(--yellow-dark)]">{sortDir === "asc" ? "↑" : "↓"}</span>;

  const exportCSV = () => {
    const hdr = "timestamp,vehicleType,brand,vehicleModel,licensePlate,plateConfidence,cameraId,laneId,trackId,speedKmh,colorLabel,colorHex";
    const body = allRows.map(e => [
      e.timestamp, e.vehicleType, e.brand, e.vehicleModel || "", e.licensePlate || "",
      e.plateConfidence ?? "", e.cameraId || "", e.laneId || "", e.trackId || "",
      e.speedKmh ?? "", e.colorLabel, e.colorHex,
    ].join(",")).join("\n");
    const blob = new Blob([hdr + "\n" + body], { type: "text/csv" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "vehicle_log.csv" });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  const COL = lang === "en"
    ? { ts: "Timestamp", type: "Vehicle Type", brand: "Brand", model: "Model", plate: "Plate", color: "Color", event: "Event" }
    : { ts: "เวลา", type: "ประเภทรถ", brand: "ยี่ห้อ", model: "รุ่นรถ", plate: "ป้ายทะเบียน", color: "สีรถ", event: "เหตุการณ์" };

  const hasFilters = typeFilter.length > 0 || brandFilter.length > 0 || colorFilter.length > 0 ||
    modelFilter.length > 0 || plateFilter.length > 0 || eventFilter.length > 0 || timeStart || timeEnd;

  const plateFilterLabel = lang === "en" ? "Plate province" : "จังหวัดป้าย";

  const emptyMetaText = lang === "en" ? "Waiting for real metadata" : "รอ metadata จริง";

  return (
    <div className="card fade-up overflow-hidden rounded-2xl border-t-4 border-[var(--yellow)] bg-[var(--surface)] shadow-[var(--shadow)]" style={{ animationDelay: "300ms" }}>
      <div className="flex flex-wrap items-center justify-between gap-3.5 border-b border-[var(--border)] px-5 py-4 min-[900px]:px-6">
        <div className="min-w-[220px]">
          <div className="text-[15.5px] font-bold text-[var(--text)]">
            {lang === "en" ? "Detection Log" : "บันทึกการตรวจจับยานพาหนะ"}
          </div>
          <div className="mt-0.5 text-xs text-[var(--subtle)]">
            Live Detection Log · {rows.length.toLocaleString()} {lang === "en" ? "entries" : "รายการ"}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2.5">
          <div className="relative min-w-[180px] flex-1 max-[760px]:basis-full min-[760px]:max-w-[260px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 flex text-[var(--subtle)]">{Icons.search}</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={lang === "en" ? "Search..." : "ค้นหา..."}
              className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface2)] px-3.5 py-2 pl-9 text-[13px] text-[var(--text)] outline-none transition-all focus:border-[var(--yellow)] focus:shadow-[0_0_0_3px_rgba(255,211,0,0.15)]" />
          </div>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" />
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[12.5px] font-semibold text-[var(--text)] transition-all hover:bg-[var(--surface2)]">
            {Icons.upload} {lang === "en" ? "Import" : "นำเข้า"}
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-[10px] border-none bg-gradient-to-br from-[#FFD300] to-[#FFAA00] px-4 py-2 text-[12.5px] font-bold text-[#1a1d23] shadow-[0_2px_8px_rgba(255,211,0,0.3)] transition-all hover:brightness-110">
            {Icons.download} {lang === "en" ? "Export CSV" : "ส่งออก CSV"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 border-b border-[var(--border)] bg-[var(--surface2)] px-5 py-3.5 min-[900px]:px-6">
        <FilterDropdown label={lang === "en" ? "Vehicle Type" : "ประเภทรถ"} options={typeOptions}
          selected={typeFilter} onToggle={v => setTypeFilter(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])}
          onClear={() => setTypeFilter([])} lang={lang} />
        <FilterDropdown label={lang === "en" ? "Brand" : "ยี่ห้อ"} options={brandOptions}
          selected={brandFilter} onToggle={v => setBrandFilter(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])}
          onClear={() => setBrandFilter([])} lang={lang} />
        <FilterDropdown label={lang === "en" ? "Color" : "สีรถ"} options={colorOptions}
          selected={colorFilter} onToggle={v => setColorFilter(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])}
          onClear={() => setColorFilter([])} lang={lang} />
        <FilterDropdown label={lang === "en" ? "Model" : "รุ่นรถ"} options={modelOptions}
          selected={modelFilter} onToggle={v => setModelFilter(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])}
          onClear={() => setModelFilter([])} lang={lang} emptyText={emptyMetaText} />
        <FilterDropdown label={plateFilterLabel} options={plateOptions}
          selected={plateFilter} onToggle={v => setPlateFilter(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])}
          onClear={() => setPlateFilter([])} lang={lang} emptyText={emptyMetaText} />
        <FilterDropdown label={lang === "en" ? "Event" : "เหตุการณ์"} options={eventOptions}
          selected={eventFilter} onToggle={v => setEventFilter(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])}
          onClear={() => setEventFilter([])} lang={lang} emptyText={emptyMetaText} />

        <div className="hidden h-7 w-px bg-[var(--border)] min-[900px]:block" />
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="whitespace-nowrap text-xs font-semibold text-[var(--subtle)]">{lang === "en" ? "From" : "จาก"}</span>
          <input type="datetime-local" value={timeStart} onChange={e => setTimeStart(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 font-mono text-xs text-[var(--text)] outline-none transition-colors focus:border-[var(--yellow)]" />
          <span className="text-xs text-[var(--subtle)]">-</span>
          <input type="datetime-local" value={timeEnd} onChange={e => setTimeEnd(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 font-mono text-xs text-[var(--text)] outline-none transition-colors focus:border-[var(--yellow)]" />
        </div>
        {hasFilters && (
          <button onClick={() => {
            setTypeFilter([]); setBrandFilter([]); setColorFilter([]);
            setModelFilter([]); setPlateFilter([]); setEventFilter([]);
            setTimeStart(""); setTimeEnd("");
          }}
            className="flex items-center gap-1 rounded-lg border border-[var(--red)] bg-[var(--red-bg)] px-3.5 py-1.5 text-[11.5px] font-semibold text-[#dc2626] transition-all">
            x {lang === "en" ? "Clear All" : "ล้างทั้งหมด"}
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1160px] border-collapse text-[13px]">
          <thead>
            <tr className="bg-[var(--thead)]">
              {([["timestamp", "ts"], ["vehicleType", "type"], ["brand", "brand"], ["vehicleModel", "model"], ["licensePlate", "plate"], ["colorLabel", "color"]] as [SortKey, keyof typeof COL][]).map(([k, lk]) => (
                <th key={k} onClick={() => toggleSort(k)}
                  className="cursor-pointer select-none whitespace-nowrap border-b-2 border-[var(--border)] px-5 py-3.5 text-left text-xs font-bold tracking-wide text-[var(--text)] transition-colors">
                  {COL[lk]} <SortIcon k={k} />
                </th>
              ))}
              <th className="whitespace-nowrap border-b-2 border-[var(--border)] px-5 py-3.5 text-left text-xs font-bold tracking-wide text-[var(--text)]">
                {COL.event}
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((e, i) => {
              const badge = BADGE_STYLES[e.vehicleType] || BADGE_STYLES["รถยนต์นั่งบุคคล"];
              const events = eventByDetectionKey.get(getDetectionKey(e)) || [];
              const typeColor = TYPE_COLORS[e.vehicleType] || "#64748b";
              const typeBg = TYPE_BG[e.vehicleType] || "rgba(100,116,139,0.08)";
              const province = plateProvince(e.licensePlate);
              return (
                <tr key={e.timestamp + i} className="trow border-b border-[var(--border)] transition-all hover:brightness-[0.985]"
                  style={{
                    background: events.length > 0
                      ? "linear-gradient(90deg, rgba(239,68,68,0.16), rgba(255,247,237,0.82) 44%, var(--surface) 100%)"
                      : `linear-gradient(90deg, ${typeBg}, var(--surface) 58%)`,
                    borderLeft: `4px solid ${events.length > 0 ? "#ef4444" : typeColor}`,
                  }}>
                  <td className="px-5 py-3 font-mono text-xs font-semibold" style={{ color: events.length > 0 ? "#b91c1c" : "var(--subtle)" }}>{formatTimestamp(e.timestamp, lang)}</td>
                  <td className="px-5 py-3">
                    <span className="whitespace-nowrap rounded-full px-3 py-1 text-[11.5px] font-semibold" style={badge}>{e.vehicleType}</span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-[var(--text)]">{e.brand}</td>
                  <td className="px-5 py-3 font-medium text-[var(--text)]">{e.vehicleModel || "-"}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[var(--text)]">{e.licensePlate || "-"}</span>
                      {province && (
                        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[10.5px] font-bold text-[var(--subtle)]">
                          {province}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-[13px] w-[13px] shrink-0 rounded-full shadow-sm" style={{ background: e.colorHex }} />
                      <span className="font-medium text-[var(--text)]">{e.colorLabel}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {events.length === 0 ? (
                      <span className="text-[12px] text-[var(--subtle)]">-</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {events.slice(0, 2).map(event => (
                          <span key={event.id} className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold" style={severityColor(event.severity)}>
                            {eventTypeLabel(event.type, lang)}
                          </span>
                        ))}
                        {events.length > 2 && <span className="text-[11px] font-bold text-[var(--subtle)]">+{events.length - 2}</span>}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {pageRows.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-sm text-[var(--subtle)]">
                {lang === "en" ? "No results found" : "ไม่พบข้อมูลที่ค้นหา"}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-[var(--border)] bg-[var(--row-alt)] px-5 py-3.5 min-[900px]:px-6">
          <span className="text-xs text-[var(--subtle)]">
            {lang === "en" ? "Showing" : "แสดง"} {((page - 1) * PER_PAGE) + 1}-{Math.min(page * PER_PAGE, sorted.length)} {lang === "en" ? "of" : "จาก"} {sorted.length}
          </span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] transition-all disabled:opacity-35">
              ←
            </button>
            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
              const n = Math.max(1, Math.min(page - 2, pages - 4)) + i;
              if (n < 1 || n > pages) return null;
              return (
                <button key={n} onClick={() => setPage(n)}
                  className={`rounded-lg px-3 py-1.5 text-xs transition-all ${page === n ? "border-none bg-gradient-to-br from-[#FFD300] to-[#FFAA00] font-bold text-[#1a1d23]" : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"}`}>
                  {n}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] transition-all disabled:opacity-35">
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
