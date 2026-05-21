"use client";

import { useState, useEffect } from "react";
import { Icons } from "./icons";
import { pad2 } from "@/lib/constants";
import type { Lang } from "@/types";

interface NavBarProps {
  dark: boolean;
  setDark: (v: boolean) => void;
  lang: Lang;
  isConnected: boolean;
}

export function NavBar({ dark, setDark, lang, isConnected }: NavBarProps) {
  const [now, setNow] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr = now?.toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) ?? "";
  const dateStrEn = now?.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) ?? "";

  return (
    <nav className="sticky top-0 z-[200] border-b border-[var(--glass-border)] backdrop-blur-xl transition-all duration-300"
      style={{ background: "var(--glass-bg)" }}>
      <div className="mx-auto flex min-h-[76px] w-full max-w-[1680px] items-center justify-between gap-4 px-[clamp(16px,2.3vw,36px)] py-3">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#FFD300] via-[#FFAA00] to-[#FF8C00] shadow-[0_8px_22px_rgba(255,184,0,0.28)]">
          <span className="text-xl font-black tracking-tight text-[#1a1d23]">NT</span>
        </div>
        <div className="min-w-0">
          <div className="text-[16px] font-extrabold leading-tight tracking-tight text-[var(--text)]">
            NT Vehicle Detection Analytics
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] font-normal text-[var(--subtle)]">
            {lang === "en" ? "Chaengwattana Center — Security Control" : "ศูนย์แจ้งวัฒนะ — ระบบตรวจจับยานพาหนะ"}
            <span className="mx-1 text-[var(--border)]">|</span>
            <span className="inline-flex items-center gap-1.5">
              <span className={`status-dot inline-block h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-400"}`}
                style={{ boxShadow: isConnected ? "0 0 8px rgba(34,197,94,0.6)" : "0 0 8px rgba(248,113,113,0.6)" }} />
              <span className={isConnected ? "text-green-600 dark:text-green-400" : "text-red-500"}>
                {isConnected ? (lang === "en" ? "Live" : "เชื่อมต่อ") : (lang === "en" ? "Offline" : "ตัดการเชื่อมต่อ")}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <div className="hidden text-right md:block">
          {mounted && now ? (
            <>
              <div className="font-mono text-[22px] font-semibold leading-none tracking-widest text-[var(--text)]">
                {pad2(now.getHours())}:{pad2(now.getMinutes())}:{pad2(now.getSeconds())}
              </div>
              <div className="mt-1.5 text-[11px] text-[var(--subtle)]">
                {lang === "en" ? dateStrEn : dateStr}
              </div>
            </>
          ) : (
            <div className="font-mono text-[22px] font-semibold leading-none tracking-widest text-[var(--subtle)]">
              --:--:--
            </div>
          )}
        </div>

        <div className="hidden h-8 w-px bg-[var(--border)] sm:block" />

        <button onClick={() => setDark(!dark)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-sm transition-all hover:bg-[var(--surface2)] hover:border-[var(--yellow)]">
          {dark ? Icons.sun : Icons.moon}
        </button>
      </div>
      </div>
    </nav>
  );
}
