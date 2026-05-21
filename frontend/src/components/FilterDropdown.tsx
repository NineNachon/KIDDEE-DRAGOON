"use client";

import { useState, useEffect, useRef } from "react";
import type { FilterOption, Lang } from "@/types";

interface Props {
  label: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (v: string) => void;
  onClear: () => void;
  lang: Lang;
  emptyText?: string;
}

export function FilterDropdown({ label, options, selected, onToggle, onClear, lang, emptyText }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const cnt = selected.length;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-[var(--border)] px-3.5 py-2 text-[12.5px] font-semibold text-[var(--text)] transition-all"
        style={{ background: cnt > 0 ? "var(--yellow-light)" : "var(--surface)" }}>
        {label}
        {cnt > 0 && (
          <span className="rounded-full bg-[var(--yellow)] px-2 py-px text-[11px] font-bold text-[#1a1d23]">{cnt}</span>
        )}
        <span className="ml-0.5 text-[9px] opacity-60">▼</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[100] mt-1.5 max-h-[340px] min-w-[240px] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2.5">
            <span className="text-[11.5px] font-bold text-[var(--subtle)]">{lang === "en" ? "Select" : "เลือก"}</span>
            <button onClick={onClear} className="border-none bg-transparent text-[11px] font-semibold text-[var(--yellow-dark)] cursor-pointer">
              {lang === "en" ? "Clear" : "ล้าง"}
            </button>
          </div>
          {options.length === 0 ? (
            <div className="px-4 py-3 text-[12px] text-[var(--subtle)]">
              {emptyText || (lang === "en" ? "No metadata yet" : "ยังไม่มี metadata")}
            </div>
          ) : (
            options.map(opt => (
              <label key={opt.value} className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors hover:bg-[var(--surface2)]">
                <input type="checkbox" className="h-4 w-4 shrink-0 cursor-pointer accent-[var(--yellow)]"
                  checked={selected.includes(opt.value)} onChange={() => onToggle(opt.value)} />
                {opt.hex && <span className="h-3 w-3 shrink-0 rounded-full border border-black/10" style={{ background: opt.hex }} />}
                <span className="font-medium text-[var(--text)]">{opt.label}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
