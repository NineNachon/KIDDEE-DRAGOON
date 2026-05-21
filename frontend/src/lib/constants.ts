import type { Lang } from "@/types";

export const TH_TYPE: Record<string, string> = {
  "รถยนต์นั่งบุคคล": "รถยนต์นั่งบุคคล",
  "รถเก๋ง": "รถเก๋ง",
  "รถตู้": "รถตู้",
  "รถจักรยานยนต์": "รถจักรยานยนต์",
  "รถกระบะ": "รถกระบะ",
  "รถบัส": "รถบัส",
  "รถบรรทุก": "รถบรรทุก",
  "รถยนต์ปิคอัพ": "รถยนต์ปิคอัพ",
};

export const EN_TYPE: Record<string, string> = {
  "รถยนต์นั่งบุคคล": "Personal Car",
  "รถเก๋ง": "Sedan",
  "รถตู้": "Van",
  "รถจักรยานยนต์": "Motorcycle",
  "รถกระบะ": "Pickup",
  "รถบัส": "Bus",
  "รถบรรทุก": "Truck",
  "รถยนต์ปิคอัพ": "Pickup",
};

export const TYPE_COLORS: Record<string, string> = {
  "รถยนต์นั่งบุคคล": "#3b82f6",
  "รถเก๋ง": "#2563eb",
  "รถตู้": "#f59e0b",
  "รถจักรยานยนต์": "#8b5cf6",
  "รถกระบะ": "#22c55e",
  "รถบัส": "#64748b",
  "รถบรรทุก": "#ef4444",
  "รถยนต์ปิคอัพ": "#22c55e",
};

export const TYPE_BG: Record<string, string> = {
  "รถยนต์นั่งบุคคล": "rgba(59,130,246,0.1)",
  "รถเก๋ง": "rgba(37,99,235,0.1)",
  "รถตู้": "rgba(245,158,11,0.1)",
  "รถจักรยานยนต์": "rgba(139,92,246,0.1)",
  "รถกระบะ": "rgba(34,197,94,0.1)",
  "รถบัส": "rgba(100,116,139,0.12)",
  "รถบรรทุก": "rgba(239,68,68,0.1)",
  "รถยนต์ปิคอัพ": "rgba(34,197,94,0.1)",
};

export const BADGE_STYLES: Record<string, { background: string; color: string; border: string }> = {
  "รถยนต์นั่งบุคคล": { background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" },
  "รถเก๋ง": { background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" },
  "รถตู้": { background: "#FFF7ED", color: "#C2410C", border: "1px solid #FED7AA" },
  "รถจักรยานยนต์": { background: "#F5F3FF", color: "#7C3AED", border: "1px solid #DDD6FE" },
  "รถกระบะ": { background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0" },
  "รถบัส": { background: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1" },
  "รถบรรทุก": { background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" },
  "รถยนต์ปิคอัพ": { background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0" },
};

export const LIVE_SPEED_MS: Record<string, number> = {
  slow: 4000,
  normal: 1000,
  fast: 200,
};

export const pad2 = (n: number) => String(n).padStart(2, "0");

export function formatTimestamp(ts: string, lang: Lang): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}
