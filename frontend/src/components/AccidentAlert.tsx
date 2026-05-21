"use client";

import { useMemo, useState } from "react";
import { eventTypeLabel } from "@/lib/advancedEvents";
import { formatTimestamp } from "@/lib/constants";
import type { AdvancedEvent, Lang } from "@/types";

interface Props {
  events: AdvancedEvent[];
  lang: Lang;
}

export function AccidentAlert({ events, lang }: Props) {
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  const accident = useMemo(() => (
    events.find(e => e.type === "accident_suspected" && e.id !== dismissedId)
  ), [events, dismissedId]);

  if (!accident) return null;

  const plate = accident.detection?.licensePlate;
  const camera = accident.detection?.cameraId;

  return (
    <div className="fixed left-1/2 top-[92px] z-[2147483638] w-[min(560px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-2xl border border-red-200 bg-white shadow-[0_18px_48px_rgba(127,29,29,0.22)] dark:border-red-900/60 dark:bg-[#161b27]">
      <div className="flex items-start gap-3 border-l-4 border-red-500 px-4 py-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
          !
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-extrabold text-red-700 dark:text-red-300">
            {lang === "en" ? "Accident alert" : "แจ้งเตือนอุบัติเหตุ"} · {eventTypeLabel(accident.type, lang)}
          </div>
          <div className="mt-1 text-[12.5px] leading-relaxed text-[var(--text)]">
            {accident.description}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-[11.5px] font-semibold text-[var(--subtle)]">
            <span>{formatTimestamp(accident.timestamp, lang)}</span>
            {plate && <span>{lang === "en" ? "Plate" : "ป้าย"}: {plate}</span>}
            {camera && <span>{lang === "en" ? "Camera" : "กล้อง"}: {camera}</span>}
            <span>{lang === "en" ? "Confidence" : "ความมั่นใจ"}: {(accident.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
        <button
          onClick={() => setDismissedId(accident.id)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--subtle)] transition-colors hover:text-[var(--text)]"
          aria-label="Dismiss accident alert"
        >
          x
        </button>
      </div>
    </div>
  );
}
