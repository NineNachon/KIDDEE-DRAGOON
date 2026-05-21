"""
NT Vehicle Detection — RAG Engine

Retrieval-Augmented Generation for vehicle data queries.
Uses keyword extraction + statistical retrieval + template generation.
Designed to be easily upgraded to an LLM-backed system.
"""

import re
from collections import Counter
from datetime import datetime
from pathlib import Path
import csv

# ── Config ──────────────────────────────────────────────────────
CSV_PATH = Path(__file__).resolve().parent.parent / "log.csv"


def load_data():
    rows = []
    with open(CSV_PATH, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows.append({
                "timestamp": row["timestamp"],
                "vehicleType": row["vehicleType"],
                "brand": row["brand"],
                "colorLabel": row["colorLabel"],
                "colorHex": row["colorHex"],
            })
    return rows


# ── Knowledge Builder ───────────────────────────────────────────
class VehicleRAG:
    def __init__(self):
        self.data = load_data()
        self._build_stats()

    def _build_stats(self):
        self.total = len(self.data)
        self.type_counts = Counter(r["vehicleType"] for r in self.data)
        self.brand_counts = Counter(r["brand"] for r in self.data)
        self.color_counts = Counter(r["colorLabel"] for r in self.data)
        self.brand_color = Counter((r["brand"], r["colorLabel"]) for r in self.data)
        self.type_brand = Counter((r["vehicleType"], r["brand"]) for r in self.data)

        # Hourly distribution
        self.hourly: dict[int, int] = Counter()
        for r in self.data:
            try:
                h = datetime.fromisoformat(r["timestamp"].replace("Z", "+00:00")).hour
                self.hourly[h] += 1
            except Exception:
                pass

        self.peak_hour = max(self.hourly, key=self.hourly.get) if self.hourly else 0
        self.quiet_hour = min(self.hourly, key=self.hourly.get) if self.hourly else 0

        # Time range
        timestamps = [r["timestamp"] for r in self.data if r["timestamp"]]
        self.time_start = min(timestamps) if timestamps else ""
        self.time_end = max(timestamps) if timestamps else ""

        # Top N
        self.top_brand = self.brand_counts.most_common(1)[0] if self.brand_counts else ("N/A", 0)
        self.top_color = self.color_counts.most_common(1)[0] if self.color_counts else ("N/A", 0)
        self.top_type = self.type_counts.most_common(1)[0] if self.type_counts else ("N/A", 0)

    # ── Intent Detection ────────────────────────────────────────
    _TH_KEYWORDS = {
        "total": ["ทั้งหมด", "รวม", "กี่คัน", "จำนวนรวม", "จำนวนทั้งหมด", "เท่าไหร่", "กี่คันวันนี้", "มีกี่"],
        "type": ["ประเภท", "รถยนต์", "รถตู้", "รถจักรยานยนต์", "รถบรรทุก", "รถยนต์ปิคอัพ",
                 "รถยนต์นั่ง", "มอเตอร์ไซค์", "รถกระบะ", "ปิคอัพ", "จักรยานยนต์"],
        "brand": ["ยี่ห้อ", "แบรนด์", "toyota", "honda", "isuzu", "mitsubishi", "mazda", "nissan",
                  "โตโยต้า", "ฮอนด้า", "อิซุซุ", "มิตซูบิชิ", "มาสด้า", "นิสสัน"],
        "color": ["สี", "สีรถ", "สีอะไร", "สีไหน", "แดง", "ดำ", "ขาว", "เงิน", "เทา", "น้ำเงิน", "เขียว", "เหลือง"],
        "time": ["เวลา", "ช่วงเวลา", "ชั่วโมง", "เมื่อไหร่", "ตอนไหน", "เยอะสุด", "น้อยสุด", "พีค", "peak"],
        "top": ["เยอะที่สุด", "มากที่สุด", "ยอดนิยม", "อันดับ", "top", "แชมป์", "เยอะสุด", "มากสุด"],
        "compare": ["เทียบ", "เปรียบเทียบ", "มากกว่า", "น้อยกว่า", "เท่าไหร่"],
        "summary": ["สรุป", "ภาพรวม", "overview", "สถานการณ์", "ทั้งหมดสรุป"],
        "hour": ["ชั่วโมง", "ต่อชั่วโมง", "รายชั่วโมง"],
    }

    _EN_KEYWORDS = {
        "total": ["total", "how many", "count", "all vehicles", "overall"],
        "type": ["vehicle type", "car type", "truck", "motorcycle", "van", "pickup", "personal car"],
        "brand": ["brand", "make", "toyota", "honda", "isuzu", "mitsubishi", "mazda", "nissan"],
        "color": ["color", "colour", "red", "black", "white", "silver", "gray"],
        "time": ["time", "hour", "when", "period", "peak"],
        "top": ["most", "top", "popular", "highest", "best"],
        "compare": ["compare", "versus", "vs", "more than", "less than"],
        "summary": ["summary", "overview", "summarize", "brief"],
        "hour": ["hourly", "per hour", "by hour"],
    }

    def _detect_intents(self, q: str) -> list[str]:
        q_lower = q.lower()
        intents = []
        for intent, keywords in {**self._TH_KEYWORDS, **self._EN_KEYWORDS}.items():
            if any(kw in q_lower for kw in keywords):
                intents.append(intent)
        if not intents:
            intents = ["summary"]
        return intents

    def _extract_specific(self, q: str) -> dict:
        """Extract specific entity mentions from question."""
        result: dict = {"types": [], "brands": [], "colors": []}
        for t in self.type_counts:
            if t in q:
                result["types"].append(t)
        for b in self.brand_counts:
            if b.lower() in q.lower():
                result["brands"].append(b)
        for c in self.color_counts:
            if c in q:
                result["colors"].append(c)
        return result

    # ── Response Generation ─────────────────────────────────────
    def query(self, question: str) -> str:
        intents = self._detect_intents(question)
        specifics = self._extract_specific(question)
        parts: list[str] = []

        is_thai = any("฀" <= c <= "๿" for c in question)

        # ─── Summary ─────────────────────────────────────────
        if "summary" in intents:
            if is_thai:
                parts.append(f"📊 **สรุปภาพรวมระบบตรวจจับยานพาหนะ**\n")
                parts.append(f"• ตรวจจับรถทั้งหมด **{self.total:,} คัน**")
                parts.append(f"• ช่วงเวลา: {self.time_start[:16]} ถึง {self.time_end[:16]}")
                parts.append(f"\n**แยกตามประเภท:**")
                for t, c in self.type_counts.most_common():
                    pct = (c / self.total * 100) if self.total else 0
                    parts.append(f"  • {t}: **{c:,} คัน** ({pct:.1f}%)")
                parts.append(f"\n**Top 3 ยี่ห้อยอดนิยม:**")
                for b, c in self.brand_counts.most_common(3):
                    parts.append(f"  • {b}: **{c:,} คัน**")
                parts.append(f"\n**Top 3 สียอดนิยม:**")
                for co, c in self.color_counts.most_common(3):
                    parts.append(f"  • {co}: **{c:,} คัน**")
                parts.append(f"\n• ช่วงเวลาที่รถเข้าเยอะที่สุด: **{self.peak_hour:02d}:00–{self.peak_hour+1:02d}:00 น.** ({self.hourly[self.peak_hour]:,} คัน)")
            else:
                parts.append(f"📊 **Vehicle Detection Summary**\n")
                parts.append(f"• Total detections: **{self.total:,} vehicles**")
                parts.append(f"• Period: {self.time_start[:16]} to {self.time_end[:16]}")
                parts.append(f"\n**By Type:**")
                for t, c in self.type_counts.most_common():
                    pct = (c / self.total * 100) if self.total else 0
                    parts.append(f"  • {t}: **{c:,}** ({pct:.1f}%)")
                parts.append(f"\n**Top 3 Brands:**")
                for b, c in self.brand_counts.most_common(3):
                    parts.append(f"  • {b}: **{c:,}**")
                parts.append(f"\n• Peak hour: **{self.peak_hour:02d}:00** ({self.hourly[self.peak_hour]:,} vehicles)")
            return "\n".join(parts)

        # ─── Total ──────────────────────────────────────────
        if "total" in intents and not specifics["types"] and not specifics["brands"]:
            if is_thai:
                parts.append(f"🚗 ตรวจจับยานพาหนะทั้งหมด **{self.total:,} คัน**")
                parts.append(f"\nแยกตามประเภท:")
                for t, c in self.type_counts.most_common():
                    pct = (c / self.total * 100) if self.total else 0
                    parts.append(f"  • {t}: **{c:,} คัน** ({pct:.1f}%)")
            else:
                parts.append(f"🚗 Total vehicles detected: **{self.total:,}**")
                parts.append(f"\nBy type:")
                for t, c in self.type_counts.most_common():
                    pct = (c / self.total * 100) if self.total else 0
                    parts.append(f"  • {t}: **{c:,}** ({pct:.1f}%)")
            return "\n".join(parts)

        # ─── Specific type query ────────────────────────────
        if specifics["types"]:
            for t in specifics["types"]:
                c = self.type_counts.get(t, 0)
                pct = (c / self.total * 100) if self.total else 0
                if is_thai:
                    parts.append(f"🚙 **{t}**: ตรวจจับ **{c:,} คัน** ({pct:.1f}% ของทั้งหมด)")
                else:
                    parts.append(f"🚙 **{t}**: detected **{c:,}** ({pct:.1f}% of total)")
                # Top brands for this type
                top_brands = [(b, cnt) for (vt, b), cnt in self.type_brand.most_common() if vt == t][:3]
                if top_brands:
                    if is_thai:
                        parts.append(f"  ยี่ห้อยอดนิยม: " + ", ".join(f"**{b}** ({cnt:,})" for b, cnt in top_brands))
                    else:
                        parts.append(f"  Top brands: " + ", ".join(f"**{b}** ({cnt:,})" for b, cnt in top_brands))

        # ─── Specific brand query ───────────────────────────
        if specifics["brands"]:
            for b in specifics["brands"]:
                c = self.brand_counts.get(b, 0)
                pct = (c / self.total * 100) if self.total else 0
                if is_thai:
                    parts.append(f"🏷️ **{b}**: ตรวจจับ **{c:,} คัน** ({pct:.1f}% ของทั้งหมด)")
                else:
                    parts.append(f"🏷️ **{b}**: detected **{c:,}** ({pct:.1f}% of total)")
                # Top types for this brand
                top_types = [(vt, cnt) for (vt, br), cnt in self.type_brand.most_common() if br == b][:3]
                if top_types:
                    if is_thai:
                        parts.append(f"  ประเภทที่พบ: " + ", ".join(f"**{vt}** ({cnt:,})" for vt, cnt in top_types))
                    else:
                        parts.append(f"  Types: " + ", ".join(f"**{vt}** ({cnt:,})" for vt, cnt in top_types))

        # ─── Specific color query ───────────────────────────
        if specifics["colors"]:
            for co in specifics["colors"]:
                c = self.color_counts.get(co, 0)
                pct = (c / self.total * 100) if self.total else 0
                if is_thai:
                    parts.append(f"🎨 **{co}**: ตรวจจับ **{c:,} คัน** ({pct:.1f}%)")
                else:
                    parts.append(f"🎨 **{co}**: detected **{c:,}** ({pct:.1f}%)")

        # ─── Top / Most ─────────────────────────────────────
        if "top" in intents and not specifics["types"] and not specifics["brands"]:
            if is_thai:
                parts.append(f"🏆 **อันดับยานพาหนะยอดนิยม:**\n")
                parts.append(f"**ยี่ห้อ Top 5:**")
                for i, (b, c) in enumerate(self.brand_counts.most_common(5), 1):
                    parts.append(f"  {i}. {b} — **{c:,} คัน** ({c/self.total*100:.1f}%)")
                parts.append(f"\n**สี Top 5:**")
                for i, (co, c) in enumerate(self.color_counts.most_common(5), 1):
                    parts.append(f"  {i}. {co} — **{c:,} คัน** ({c/self.total*100:.1f}%)")
                parts.append(f"\n**ประเภทที่พบมากที่สุด:**")
                for t, c in self.type_counts.most_common():
                    parts.append(f"  • {t}: **{c:,} คัน**")
            else:
                parts.append(f"🏆 **Top Rankings:**\n")
                parts.append(f"**Top 5 Brands:**")
                for i, (b, c) in enumerate(self.brand_counts.most_common(5), 1):
                    parts.append(f"  {i}. {b} — **{c:,}** ({c/self.total*100:.1f}%)")
                parts.append(f"\n**Top 5 Colors:**")
                for i, (co, c) in enumerate(self.color_counts.most_common(5), 1):
                    parts.append(f"  {i}. {co} — **{c:,}** ({c/self.total*100:.1f}%)")

        # ─── Time / Hourly ──────────────────────────────────
        if "time" in intents or "hour" in intents:
            if is_thai:
                parts.append(f"⏰ **การกระจายตามช่วงเวลา:**\n")
                parts.append(f"• ช่วงเยอะที่สุด: **{self.peak_hour:02d}:00–{self.peak_hour+1:02d}:00 น.** ({self.hourly[self.peak_hour]:,} คัน)")
                parts.append(f"• ช่วงน้อยที่สุด: **{self.quiet_hour:02d}:00–{self.quiet_hour+1:02d}:00 น.** ({self.hourly[self.quiet_hour]:,} คัน)")
                parts.append(f"\nรายชั่วโมง:")
                for h in sorted(self.hourly):
                    bar = "█" * (self.hourly[h] // max(self.hourly.values()) * 15 + 1)
                    parts.append(f"  {h:02d}:00 │ {bar} {self.hourly[h]:,}")
            else:
                parts.append(f"⏰ **Hourly Distribution:**\n")
                parts.append(f"• Peak: **{self.peak_hour:02d}:00** ({self.hourly[self.peak_hour]:,} vehicles)")
                parts.append(f"• Quietest: **{self.quiet_hour:02d}:00** ({self.hourly[self.quiet_hour]:,} vehicles)")
                parts.append(f"\nBy hour:")
                for h in sorted(self.hourly):
                    bar = "█" * (self.hourly[h] // max(self.hourly.values()) * 15 + 1)
                    parts.append(f"  {h:02d}:00 │ {bar} {self.hourly[h]:,}")

        if not parts:
            if is_thai:
                parts.append("ขออภัย ไม่เข้าใจคำถาม ลองถามเกี่ยวกับ:\n• จำนวนรถทั้งหมด\n• ประเภทรถ / ยี่ห้อ / สี\n• ช่วงเวลาที่รถเยอะ\n• สรุปภาพรวม")
            else:
                parts.append("I'm not sure I understand. Try asking about:\n• Total vehicle count\n• Vehicle types / brands / colors\n• Peak hours\n• Summary overview")

        return "\n".join(parts)
