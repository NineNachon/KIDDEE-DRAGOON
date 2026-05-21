"use client";

import { useState, useRef, useEffect } from "react";
import type { Lang } from "@/types";

interface Message {
  role: "user" | "bot";
  text: string;
}

interface Props {
  lang: Lang;
}

const SUGGESTIONS_TH = [
  "ค้นหารถสีแดง",
  "ค้นหารถกระบะช่วงเวลา 18:00 - 20:00",
  "ค้นหารถที่มีพฤติกรรมขับเร็ว",
  "สรุปเหตุการณ์ผิดปกติประจำวัน",
  "ค้นหารถยี่ห้อ Toyota รุ่น Fortuner สีขาว",
];

const SUGGESTIONS_EN = [
  "Find red vehicles",
  "Find pickup trucks from 18:00 - 20:00",
  "Find speeding behavior",
  "Summarize today's abnormal events",
  "Find white Toyota Fortuner vehicles",
];

const MOCK_RESPONSES: Array<{ match: string[]; answer: string }> = [
  {
    match: ["รถสีแดง"],
    answer:
      "**ผลการค้นหา: รถสีแดง**\n\nพบรถสีแดงทั้งหมด **18 คัน** จากข้อมูลวันนี้\n\nรายการล่าสุด:\n• 18:42:15 · Toyota Yaris · ป้าย 2กข-4581 · กล้อง CAM-03\n• 18:31:02 · Honda Civic · ป้าย 7กง-9124 · กล้อง CAM-01\n• 17:58:40 · Mazda 2 · ป้าย 1ขต-6630 · กล้อง CAM-02\n\nสรุป: รถสีแดงพบมากที่สุดช่วง **18:00 - 19:00** และส่วนใหญ่อยู่ในกล้อง CAM-03",
  },
  {
    match: ["กระบะ", "18:00", "20:00"],
    answer:
      "**ผลการค้นหา: รถกระบะช่วงเวลา 18:00 - 20:00**\n\nพบรถกระบะทั้งหมด **42 คัน**\n\nแยกตามยี่ห้อ:\n• Toyota Hilux Revo: 16 คัน\n• Isuzu D-Max: 14 คัน\n• Ford Ranger: 7 คัน\n• Mitsubishi Triton: 5 คัน\n\nกล้องที่พบมากที่สุด: **CAM-02** จำนวน 19 คัน\nช่วงที่หนาแน่นที่สุด: **18:30 - 19:00**",
  },
  {
    match: ["ขับเร็ว"],
    answer:
      "**ผลการค้นหา: พฤติกรรมขับเร็ว**\n\nพบเหตุการณ์ขับเร็ว **7 เหตุการณ์** วันนี้\n\nรายการสำคัญ:\n• 19:12:44 · Toyota Fortuner สีขาว · 108 km/h · CAM-04 · ระดับ High\n• 18:55:10 · Honda Civic สีดำ · 101 km/h · CAM-02 · ระดับ Medium\n• 18:21:33 · Isuzu D-Max สีเทา · 96 km/h · CAM-01 · ระดับ Medium\n\nคำแนะนำ: ควรตรวจสอบคลิปช่วง **18:20 - 19:15** เพราะมีพฤติกรรมขับเร็วต่อเนื่องหลายคัน",
  },
  {
    match: ["ผิดปกติ", "ประจำวัน"],
    answer:
      "**สรุปเหตุการณ์ผิดปกติประจำวัน**\n\nพบเหตุการณ์ทั้งหมด **14 เหตุการณ์**\n\nแยกตามประเภท:\n• ขับเร็ว: 7 เหตุการณ์\n• ขับวน: 3 เหตุการณ์\n• จอดนิ่งผิดปกติ: 2 เหตุการณ์\n• ย้อนศร: 1 เหตุการณ์\n• สงสัยอุบัติเหตุ: 1 เหตุการณ์\n\nเหตุการณ์ที่ควรตรวจสอบก่อน:\n**19:12:44 · สงสัยอุบัติเหตุ · CAM-04**\nรถ 2 คันหยุดกะทันหันในเลนซ้าย ความมั่นใจ 78%",
  },
  {
    match: ["toyota", "fortuner", "สีขาว"],
    answer:
      "**ผลการค้นหา: Toyota Fortuner สีขาว**\n\nพบทั้งหมด **3 คัน**\n\nรายการที่พบ:\n• 19:12:44 · ป้าย 4กท-8891 · CAM-04 · ความเร็ว 108 km/h · มี event ขับเร็ว\n• 18:47:09 · ป้าย 8ขว-1207 · CAM-02 · ความเร็ว 54 km/h · ปกติ\n• 17:33:52 · ป้าย 6กม-7740 · CAM-01 · ความเร็ว 38 km/h · ปกติ\n\nหมายเหตุ: คันแรกถูกจัดเป็นรายการเฝ้าระวัง เพราะมีพฤติกรรมขับเร็วและปรากฏซ้ำใน CAM-04",
  },
  {
    match: ["red"],
    answer:
      "**Search result: red vehicles**\n\nFound **18 red vehicles** today.\n\nLatest matches:\n• 18:42:15 · Toyota Yaris · Plate 2กข-4581 · CAM-03\n• 18:31:02 · Honda Civic · Plate 7กง-9124 · CAM-01\n• 17:58:40 · Mazda 2 · Plate 1ขต-6630 · CAM-02",
  },
  {
    match: ["pickup", "18:00", "20:00"],
    answer:
      "**Search result: pickup trucks from 18:00 - 20:00**\n\nFound **42 pickup trucks**.\n\nTop brands:\n• Toyota Hilux Revo: 16\n• Isuzu D-Max: 14\n• Ford Ranger: 7\n• Mitsubishi Triton: 5",
  },
  {
    match: ["speeding"],
    answer:
      "**Search result: speeding behavior**\n\nFound **7 speeding events** today.\n\nKey event:\n• 19:12:44 · White Toyota Fortuner · 108 km/h · CAM-04 · High severity",
  },
  {
    match: ["abnormal"],
    answer:
      "**Daily abnormal event summary**\n\nFound **14 abnormal events**:\n• Speeding: 7\n• Looping: 3\n• Stopped vehicle: 2\n• Wrong way: 1\n• Accident suspected: 1",
  },
  {
    match: ["toyota", "fortuner", "white"],
    answer:
      "**Search result: white Toyota Fortuner**\n\nFound **3 vehicles**.\n\n• 19:12:44 · Plate 4กท-8891 · CAM-04 · 108 km/h · Speeding event\n• 18:47:09 · Plate 8ขว-1207 · CAM-02 · Normal\n• 17:33:52 · Plate 6กม-7740 · CAM-01 · Normal",
  },
];

function getMockAnswer(text: string) {
  const q = text.toLowerCase().replace(/\s+/g, " ").trim();
  const hit = MOCK_RESPONSES.find(item =>
    item.match.every(keyword => q.includes(keyword.toLowerCase()))
  );
  if (hit) return hit.answer;

  return "**Mock Chatbot พร้อมใช้งาน**\n\nตอนนี้รองรับคำถามตัวอย่าง 5 แบบ:\n• ค้นหารถสีแดง\n• ค้นหารถกระบะช่วงเวลา 18:00 - 20:00\n• ค้นหารถที่มีพฤติกรรมขับเร็ว\n• สรุปเหตุการณ์ผิดปกติประจำวัน\n• ค้นหารถยี่ห้อ Toyota รุ่น Fortuner สีขาว\n\nข้อมูลที่แสดงเป็นข้อมูลจำลองสำหรับเดโม UI/RAG flow ก่อนต่อ metadata จริง";
}

export function ChatBot({ lang }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 450));
      const botMsg: Message = { role: "bot", text: getMockAnswer(text.trim()) };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = lang === "en" ? SUGGESTIONS_EN : SUGGESTIONS_TH;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-[2147483640] flex h-14 w-14 items-center justify-center rounded-2xl border-none bg-gradient-to-br from-[#FFD300] via-[#FFAA00] to-[#FF8C00] text-[22px] text-[#1a1d23] shadow-[0_6px_24px_rgba(255,211,0,0.4)] transition-transform hover:scale-110 active:scale-95"
        title="Open Chat"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-[2147483640] flex h-[520px] w-[400px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-2xl border border-[var(--glass-border)] shadow-[0_12px_48px_rgba(0,0,0,0.15)]"
      style={{ background: "var(--glass-bg)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)" }}>

      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5"
        style={{ background: "linear-gradient(135deg, rgba(255,211,0,0.08), rgba(255,170,0,0.04))" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFD300] to-[#FFAA00]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1d23" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <div className="text-[13.5px] font-bold text-[var(--text)]">
              {lang === "en" ? "Vehicle Analytics Assistant" : "ผู้ช่วยวิเคราะห์ยานพาหนะ"}
            </div>
            <div className="text-[10.5px] text-[var(--subtle)]">
              {lang === "en" ? "Mock RAG search demo" : "Mock RAG สำหรับค้นหา Metadata"}
            </div>
          </div>
        </div>
        <button onClick={() => setOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border-none bg-transparent text-[var(--subtle)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]">
          x
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3" style={{ scrollbarWidth: "thin" }}>
        {messages.length === 0 && (
          <div className="mt-4 text-center">
            <div className="text-[13px] font-medium text-[var(--subtle)]">
              {lang === "en" ? "Hi! Try asking:" : "ลองถามจากชุด Mock นี้"}
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {suggestions.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[11.5px] font-medium text-[var(--text)] transition-all hover:border-[var(--yellow)] hover:bg-[var(--yellow-light)] hover:shadow-sm">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
              msg.role === "user"
                ? "bg-gradient-to-br from-[#FFD300] to-[#FFAA00] text-[#1a1d23] font-medium"
                : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"
            }`}>
              {msg.role === "bot" ? (
                <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
                  __html: msg.text
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\n/g, "<br/>")
                }} />
              ) : msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="mb-3 flex justify-start">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--yellow)]" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--yellow)]" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--yellow)]" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {messages.length > 0 && !loading && (
        <div className="flex gap-1.5 overflow-x-auto border-t border-[var(--border)] px-4 py-2" style={{ scrollbarWidth: "none" }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => send(s)}
              className="shrink-0 rounded-lg border border-[var(--border)] px-2.5 py-1 text-[10.5px] font-medium text-[var(--subtle)] transition-all hover:border-[var(--yellow)] hover:text-[var(--text)]">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-[var(--border)] p-3">
        <form onSubmit={e => { e.preventDefault(); send(input); }}
          className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={lang === "en" ? "Ask about vehicle data..." : "ถามเกี่ยวกับข้อมูลรถ..."}
            disabled={loading}
            className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[13px] text-[var(--text)] outline-none transition-all placeholder:text-[var(--subtle)] focus:border-[var(--yellow)] focus:shadow-[0_0_0_3px_rgba(255,211,0,0.12)] disabled:opacity-50"
          />
          <button type="submit" disabled={loading || !input.trim()}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border-none bg-gradient-to-br from-[#FFD300] to-[#FFAA00] text-[#1a1d23] transition-all hover:brightness-110 disabled:opacity-40">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
