# NT CCTV AI Camera — Vehicle Detection Analytics Dashboard

ระบบตรวจจับยานพาหนะแบบ Real-time สำหรับศูนย์การค้าแจ้งวัฒนะ พัฒนาด้วย Next.js 15 + FastAPI + WebSocket 

---

## สารบัญ

- [ภาพรวมโปรเจกต์](#ภาพรวมโปรเจกต์)
- [สถาปัตยกรรมระบบ](#สถาปัตยกรรมระบบ)
- [วิธีรันโปรเจกต์](#วิธีรันโปรเจกต์)
- [วิธีเชื่อมต่อกับ Metadata จริง](#วิธีเชื่อมต่อกับ-metadata-จริง)
- [Backend — อธิบายทุกฟังก์ชัน](#backend--อธิบายทุกฟังก์ชัน)
- [Frontend — อธิบายทุก Component](#frontend--อธิบายทุก-component)
- [API Endpoints](#api-endpoints)
- [โครงสร้างไฟล์](#โครงสร้างไฟล์)
- [แนวทางพัฒนาต่อ](#แนวทางพัฒนาต่อ)

---

## ภาพรวมโปรเจกต์

โปรเจกต์นี้เป็น **Dashboard จำลอง** สำหรับแสดงผลข้อมูลการตรวจจับยานพาหนะผ่านกล้อง CCTV ปัจจุบันใช้ไฟล์ CSV (`log.csv`) เป็นแหล่งข้อมูลจำลอง และสตรีมผ่าน WebSocket ไปยัง Frontend

**ฟีเจอร์หลัก:**
- แสดงจำนวนยานพาหนะแบบ Real-time พร้อม Animation
- กราฟโดนัท (สีรถ) + กราฟเส้น (แนวโน้มรายชั่วโมง)
- อันดับ Top 5 แบรนด์ + สัดส่วนประเภทรถ
- ตารางข้อมูลแบบ Filter, Sort, Search, Export CSV
- ระบบแจ้งเตือนอุบัติเหตุ (Accident Alert)
- ระบบแชทบอทสอบถามข้อมูล (Chatbot)
- รองรับ Dark Mode
- Docker Compose สำหรับ deploy ง่าย

---

## สถาปัตยกรรมระบบ

```
┌─────────────────────────────────────────────────────────────────────┐
│                        แหล่งข้อมูล (Data Source)                      │
│                                                                     │
│   ปัจจุบัน: log.csv (500 แถว)                                       │
│   อนาคต:  AI Model / CCTV Camera → Metadata JSON                   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     Backend (FastAPI :8000)                          │
│                                                                      │
│  main.py ──── อ่าน CSV → สตรีมผ่าน WebSocket (/ws/stream)            │
│  analytics.py ── วิเคราะห์เหตุการณ์ผิดปกติ (speeding, accident ฯลฯ)    │
│  rag.py ──── ระบบตอบคำถามจากข้อมูลยานพาหนะ                         │
│  vision_schema.py ── โครงสร้างข้อมูล Pydantic Models                 │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ WebSocket + REST API
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js :3000)                          │
│                                                                      │
│  page.tsx ──── หน้า Dashboard หลัก                                   │
│  ├── NavBar ──── แถบบน (logo, นาฬิกา, สถานะ connection)              │
│  ├── StatCard ──── การ์ดแสดงจำนวนยานพาหนะ (มี Animation)            │
│  ├── DonutChart ──── กราฟวงกลม สัดส่วนสีรถ                           │
│  ├── TrendChart ──── กราฟพื้นที่ แนวโน้มรายชั่วโมง                    │
│  ├── TopBrandsCard ──── อันดับ 5 แบรนด์ยอดนิยม                       │
│  ├── TypeDistribution ──── สัดส่วนประเภทรถ                           │
│  ├── DataTable ──── ตารางข้อมูล (Filter, Sort, Search, Export)       │
│  ├── AccidentAlert ──── แบนเนอร์แจ้งเตือนอุบัติเหตุ                   │
│  ├── ChatBot ──── แชทบอทสอบถามข้อมูล                                │
│  └── TweaksPanel ──── ตั้งค่า Dark Mode / ความเร็ว Live Feed         │
└──────────────────────────────────────────────────────────────────────┘
```

---

## วิธีรันโปรเจกต์

### วิธีที่ 1: Docker Compose (แนะนำ)

```bash
docker-compose up --build
```

- Frontend → http://localhost:3000
- Backend → http://localhost:8000

### วิธีที่ 2: รันแยกส่วน

**Backend:**

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

| ตัวแปร | ค่าเริ่มต้น | คำอธิบาย |
|---------|-------------|----------|
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8000/ws/stream` | WebSocket URL |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API URL |

---

## วิธีเชื่อมต่อกับ Metadata จริง

### Metadata คืออะไร?

Metadata ในที่นี้คือ **ข้อมูลที่ AI Model ตรวจจับได้จากกล้อง CCTV** แล้วแปลงเป็น JSON ส่งเข้าระบบ

### โครงสร้าง Metadata ที่ระบบรองรับ

ระบบรองรับ 2 ระดับของ Metadata:

#### ระดับ 1 — ข้อมูลพื้นฐาน (Basic)

ไฟล์ CSV ต้องมีคอลัมน์เหล่านี้:

```csv
timestamp,vehicleType,brand,colorLabel,colorHex
2026-05-19T23:08:53Z,รถยนต์นั่งบุคคล,Toyota,ขาว,#FFFFFF
```

| คอลัมน์ | ประเภท | คำอธิบาย |
|---------|---------|----------|
| `timestamp` | ISO 8601 | เวลาที่ตรวจจับ |
| `vehicleType` | string | ประเภทรถ เช่น `รถยนต์นั่งบุคคล`, `รถตู้`, `รถจักรยานยนต์`, `รถบรรทุก`, `รถยนต์ปิคอัพ` |
| `brand` | string | แบรนด์รถ เช่น `Toyota`, `Honda`, `Nissan` |
| `colorLabel` | string | ชื่อสี เช่น `ขาว`, `ดำ`, `แดง` |
| `colorHex` | string | รหัสสี เช่น `#FFFFFF` |

#### ระดับ 2 — ข้อมูลขั้นสูง (Enriched)

เพิ่มคอลัมน์เหล่านี้เข้าไปใน CSV หรือ JSON:

```csv
timestamp,vehicleType,brand,colorLabel,colorHex,vehicleModel,licensePlate,plateConfidence,cameraId,laneId,trackId,frameId,confidence,bboxX,bboxY,bboxWidth,bboxHeight,speedKmh,directionDeg,expectedDirectionDeg,locationX,locationY
```

| คอลัมน์ | ประเภท | คำอธิบาย | ใช้ที่ไหน |
|---------|---------|----------|-----------|
| `vehicleModel` | string | รุ่นรถ เช่น `Fortuner`, `Civic` | DataTable (คอลัมน์ Model) |
| `licensePlate` | string | ป้ายทะเบียน เช่น `กข1234` | DataTable (คอลัมน์ Plate) |
| `plateConfidence` | float 0-1 | ความมั่นใจในการอ่านป้าย | แสดงใน DataTable |
| `cameraId` | string | รหัสกล้อง | DataTable + Analytics |
| `laneId` | string | รหัสเลน | Analytics |
| `trackId` | string | รหัสติดตามวัตถุ | Analytics (ลูป, ซ้ำ) |
| `frameId` | string | เลขเฟรม | DataTable |
| `confidence` | float 0-1 | ความมั่นใจในการตรวจจับ | DataTable |
| `bboxX,bboxY,bboxWidth,bboxHeight` | float | Bounding Box ตำแหน่งวัตถุ | สำหรับวาดกล่องบนภาพ |
| `speedKmh` | float | ความเร็ว (กม./ชม.) | Analytics (จับเร่งความเร็ว/อุบัติเหตุ) |
| `directionDeg` | float | ทิศทางการเคลื่อนที่ (องศา) | Analytics (จับวิ่งผิดทาง) |
| `expectedDirectionDeg` | float | ทิศทางที่ควรเป็น | Analytics (เปรียบเทียบทิศทาง) |
| `locationX,locationY` | float | พิกัด GPS หรือตำแหน่ง | Analytics (Geofencing) |

### วิธีเชื่อมต่อ 3 ช่องทาง

#### ช่องทาง 1: แทนที่ไฟล์ CSV (ง่ายสุด)

แค่เตรียม CSV ตามโครงสร้างด้านบน แล้ววางทับไฟล์ `log.csv`:

```
log.csv  ← แทนที่ด้วยข้อมูลจริง
```

Backend จะอ่านไฟล์นี้และสตรีมอัตโนมัติ

#### ช่องทาง 2: รับข้อมูลผ่าน REST API

แก้ `backend/main.py` เพิ่ม endpoint รับข้อมูลเข้า:

```python
@app.post("/api/detection")
async def receive_detection(detection: VehicleDetection):
    # รับข้อมูลจาก AI Model แล้ว broadcast ไปยัง Frontend
    await manager.broadcast({
        "type": "detection",
        "data": detection.model_dump()
    })
    return {"status": "ok"}
```

#### ช่องทาง 3: เชื่อมต่อ Message Queue

สำหรับระบบ Production แนะนำใช้ Message Queue:

```python
# เพิ่มใน main.py
import asyncio
import aiokafka

async def kafka_consumer():
    consumer = aiokafka.AIOKafkaConsumer("detections", bootstrap_servers="kafka:9092")
    await consumer.start()
    async for msg in consumer:
        data = json.loads(msg.value)
        await manager.broadcast({"type": "detection", "data": data})
```

### Flow การเชื่อมต่อจริง

```
กล้อง CCTV
    │
    ▼
AI Model (YOLO / RT-DETR / etc.)
    │  ← ตรวจจับวัตถุ → แปลงเป็น Metadata JSON
    │
    ▼
POST /api/detection หรือ Kafka Topic
    │
    ▼
FastAPI Backend
    │  ← บันทึก + Broadcast
    │
    ▼ (WebSocket)
Next.js Frontend Dashboard
```

---

## Backend — อธิบายทุกฟังก์ชัน

### `main.py` — FastAPI Server หลัก

| ฟังก์ชัน / คลาส | หน้าที่ |
|------------------|---------|
| `ConnectionManager` | จัดการ WebSocket connections ทั้งหมด — `connect()` รับ connection, `disconnect()` ลบ, `broadcast()` ส่งข้อมูลทุก client |
| `load_csv()` | อ่านไฟล์ CSV ด้วย `csv.DictReader` คืน list ของ dict |
| `load_detections()` | อ่าน CSV แล้วแปลงเป็น Pydantic `VehicleDetection` objects |
| `parse_detection_row()` | (เรียกจาก vision_schema) แปลง dict แถวเดียวเป็น VehicleDetection |
| `csv_streamer()` | Background task วนลูปส่งแถว CSV ทีละแถวผ่าน WebSocket ด้วย delay ที่ตั้งไว้ (default 40ms) |
| `lifespan()` | ทำงานตอนเริ่ม/ปิด server — สร้าง RAG index + เริ่ม csv_streamer |
| `WS /ws/stream` | WebSocket endpoint — ส่ง history ทั้งหมดตอนเชื่อมต่อ แล้วสตรีมข้อมูลใหม่ |
| `GET /api/history` | คืนข้อมูลการตรวจจับทั้งหมด |
| `GET /api/stats` | คืนสถิติรวม (จำนวนทั้งหมด, ตามประเภท/แบรนด์/สี) |
| `GET /api/advanced-events` | วิเคราะห์เหตุการณ์ผิดปกติจาก analytics.py |
| `POST /api/chat` | รับคำถาม → ส่งให้ RAG engine → คืนคำตอบ |
| `GET /health` | คืนสถานะ server (ใช้สำหรับ health check) |

### `analytics.py` — วิเคราะห์เหตุการณ์ผิดปกติ

| ฟังก์ชัน | หน้าที่ |
|----------|---------|
| `_parse_ts()` | แปลง string timestamp เป็น datetime |
| `_seconds_between()` | คำนวณวินาทีระหว่าง 2 timestamps |
| `_event_id()` | สร้าง ID ไม่ซ้ำสำหรับแต่ละเหตุการณ์ |
| `_direction_delta()` | คำนวณผลต่างทิศทาง (องศา) |
| `_vehicle_key()` | สร้าง key ระบุยานพาหนะ (trackId + cameraId) |
| `detect_advanced_events()` | ฟังก์ชันหลัก — ตรวจจับเหตุการณ์ทั้งหมด |

**ประเภทเหตุการณ์ที่ตรวจจับ:**

| เหตุการณ์ | เงื่อนไข | ระดับ |
|-----------|---------|-------|
| `speeding` | ความเร็ว > 90 กม./ชม. | medium (< 120) / high (>= 120) |
| `wrong_way` | ทิศทางเบี่ยงเกิน 120° จากที่ควรเป็น | medium |
| `abnormal_looping` | รถคันเดียวผ่าน >= 3 ครั้งใน 15 นาที | medium |
| `accident_suspected` | ความเร็วลด >= 35 กม./ชม. ใน <= 6 วินาที | critical |
| `stopped_vehicle` | รถจอดนิ่ง >= 45 วินาที (>= 2 ครั้ง) | medium |
| `abnormal_repeat_plate` | ป้ายทะเบียนเดียวกันหลาย trackId | low |

### `rag.py` — ระบบตอบคำถาม (RAG Engine)

| ฟังก์ชัน | หน้าที่ |
|----------|---------|
| `VehicleRAG.__init__()` | โหลด CSV แล้วสร้าง index — นับจำนวนตามประเภท/แบรนด์/สี, สร้าง cross-tables, หา peak/quiet hours |
| `_detect_intents()` | วิเคราะห์ intent จากคำถาม (total, type, brand, color, time, top, compare, summary, hour) — รองรับภาษาไทยและอังกฤษ |
| `_extract_specific()` | ดึง entity ที่ระบุในคำถาม (เช่น "โตโยต้า" → brand=Toyota) |
| `query()` | ฟังก์ชันหลัก — รับคำถาม → วิเคราะห์ intent → สร้างคำตอบ (รองรับทั้งภาษาไทยและอังกฤษ) |

**ประเภทคำถามที่รองรับ:**
- สรุปภาพรวม: "สรุปภาพรวมให้หน่อย"
- จำนวนตามประเภท: "รถกระบะมีกี่คัน"
- แบรนด์/สีเฉพาะเจาะจง: "โตโยต้าสีขาวมีกี่คัน"
- Top 5: "แบรนด์ยอดนิยมคืออะไร"
- ช่วงเวลา: "ช่วงไหนคนเยอะสุด"

### `vision_schema.py` — โครงสร้างข้อมูล

| Model | หน้าที่ |
|-------|---------|
| `BoundingBox` | ตำแหน่งกล่อง (x, y, width, height) |
| `VehicleDetection` | ข้อมูลการตรวจจับยานพาหนะ — มี required fields (timestamp, vehicleType, brand, colorLabel, colorHex) และ optional enriched fields |
| `AdvancedEvent` | เหตุการณ์ผิดปกติ — id, type, severity, title, description, confidence, evidence |
| `parse_detection_row()` | แปลง CSV dict → VehicleDetection model (จัดการ optional fields อัตโนมัติ) |

---

## Frontend — อธิบายทุก Component

### หน้าหลัก

| ไฟล์ | หน้าที่ |
|------|---------|
| `page.tsx` | หน้า Dashboard หลัก — จัดการ state ทั้งหมด, เชื่อม WebSocket, polling advanced-events, filter/search |
| `layout.tsx` | Root layout — ตั้งค่า fonts (Sarabun สำหรับภาษาไทย, JetBrains Mono), metadata |
| `globals.css` | CSS หลัก — Tailwind v4, Dark Mode, Glass Morphism, Animations |

### Components

| Component | หน้าที่ |
|-----------|---------|
| `NavBar` | แถบด้านบน — โลโก้ NT, ชื่อโปรเจกต์, นาฬิกาเรียลไทม์, สถานะ WebSocket (จุดเขียว/แดง), ปุ่ม Dark Mode |
| `StatCard` | การ์ดแสดงจำนวน — มี Animation count-up, icon, trend badge (ขึ้น/ลง x%) |
| `DonutChart` | กราฟโดนัท SVG — แสดงสัดส่วนสีรถ, hover แสดง %, legend ด้านขวา |
| `TrendChart` | กราฟพื้นที่ SVG — แสดงแนวโน้มจำนวนรถรายชั่วโมง, hover แสดง tooltip |
| `TopBrandsCard` | อันดับ 5 แบรนด์ — เหรียญ icon + progress bar + จำนวน + % |
| `TypeDistribution` | สัดส่วนประเภทรถ — icon ตามประเภท + progress bar + จำนวน + % |
| `DataTable` | ตารางข้อมูล — Sort (คลิก header), Pagination (15 แถว/หน้า), Filter 6 ประเภท, Search, Export CSV |
| `AccidentAlert` | แบนเนอร์แจ้งเตือน — แสดงเมื่อมีเหตุการณ์ `accident_suspected`, มีข้อมูล ป้ายทะเบียน/กล้อง/ความมั่นใจ |
| `ChatBot` | แชทบอท — widget ลอยมุมซ้ายล่าง, มี suggestion chips, รองรับภาษาไทย (ปัจจุบันใช้ mock responses) |
| `TweaksPanel` | ตั้งค่า — ลอยมุมขวาล่าง, ปรับ Dark Mode / ความเร็ว Live Feed, ลากย้ายได้ |
| `FilterDropdown` | Dropdown filter — multi-select พร้อม checkbox, badge นับจำนวนที่เลือก |

### Hooks

| Hook | หน้าที่ |
|------|---------|
| `useWebSocket` | จัดการ WebSocket — auto-reconnect ทุก 3 วินาที, track connection state |
| `useCountUp` | Animation นับเลข — ใช้ requestAnimationFrame + cubic ease-out |

### Lib / Utils

| ไฟล์ | หน้าที่ |
|------|---------|
| `constants.ts` | สีตามประเภทรถ, badge styles, mapping ความเร็ว live feed, formatters |
| `advancedEvents.ts` | สร้าง detection key, map event type → ชื่อไทย/อังกฤษ, severity → สี |

---

## API Endpoints

| Method | Path | คำอธิบาย |
|--------|------|----------|
| `WS` | `/ws/stream` | WebSocket — รับ history ตอนเชื่อมต่อ แล้วสตรีม detection ใหม่ |
| `GET` | `/api/history` | ข้อมูล detection ทั้งหมด (JSON array) |
| `GET` | `/api/stats` | สถิติรวม: total, types, brands, colors |
| `GET` | `/api/advanced-events` | เหตุการณ์ผิดปกติที่ตรวจจับได้ |
| `POST` | `/api/chat` | ส่งคำถาม → รับคำตอบ (body: `{"message": "..."}`) |
| `GET` | `/health` | สถานะ server |

**ตัวอย่าง Response:**

```json
// GET /api/stats
{
  "total": 500,
  "types": {"รถยนต์นั่งบุคคล": 180, "รถตู้": 95, ...},
  "brands": {"Toyota": 110, "Honda": 85, ...},
  "colors": {"ขาว": 150, "ดำ": 120, ...}
}

// GET /api/advanced-events
[
  {
    "id": "evt_abc123",
    "type": "speeding",
    "severity": "medium",
    "title": "Speeding Detected",
    "description": "รถยนต์วิ่ง 105 กม./ชม.",
    "confidence": 0.74
  }
]
```

---

## โครงสร้างไฟล์

```
NT CCTV AI Camera/
├── .gitignore
├── docker-compose.yml              # Docker Compose config
├── log.csv                         # ข้อมูลจำลอง (500 แถว)
├── NT Vehicle Detection Dashboard.html  # Prototype HTML (แยกจาก Next.js)
├── tweaks-panel.jsx                # ไลบรารี่ UI tweaks
├── uploads/message.txt             # สเปค UI เดิม
│
├── backend/
│   ├── main.py                     # FastAPI server หลัก
│   ├── analytics.py                # วิเคราะห์เหตุการณ์ผิดปกติ
│   ├── rag.py                      # ระบบตอบคำถาม
│   ├── vision_schema.py            # Pydantic data models
│   ├── Dockerfile                  # Python 3.12 container
│   └── requirements.txt            # fastapi, uvicorn, websockets
│
├── frontend/
│   ├── package.json                # Next.js 15, React 19, Tailwind 4
│   ├── next.config.mjs             # standalone output
│   ├── Dockerfile                  # Multi-stage Node 20 build
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── globals.css
│       ├── components/
│       │   ├── NavBar.tsx
│       │   ├── StatCard.tsx
│       │   ├── DonutChart.tsx
│       │   ├── TrendChart.tsx
│       │   ├── TopBrandsCard.tsx
│       │   ├── TypeDistribution.tsx
│       │   ├── DataTable.tsx
│       │   ├── AccidentAlert.tsx
│       │   ├── ChatBot.tsx
│       │   ├── TweaksPanel.tsx
│       │   ├── FilterDropdown.tsx
│       │   └── icons.tsx
│       ├── hooks/
│       │   ├── useWebSocket.ts
│       │   └── useCountUp.ts
│       ├── lib/
│       │   ├── constants.ts
│       │   └── advancedEvents.ts
│       └── types/
│           └── index.ts
│
└── docs/
    └── ADVANCED_VISION_FEATURES_HANDOFF.md   # Roadmap พัฒนาต่อ
```

---

## แนวทางพัฒนาต่อ

### สิ่งที่ต้องทำต่อ (ตามลำดับความสำคัญ)

1. **เชื่อมต่อ AI Model จริง** — แทนที่ CSV ด้วยข้อมูลจากโมเดลตรวจจับ (เช่น YOLO, RT-DETR) ดูวิธีที่ [หัวข้อเชื่อมต่อ Metadata](#วิธีเชื่อมต่อกับ-metadata-จริง)

2. **License Plate OCR** — เพิ่มคอลัมน์ `licensePlate` และ `plateConfidence` เข้า metadata → ระบบพร้อมแสดงผลทันที

3. **อัปเกรด ChatBot** — ตอนนี้ ChatBot ใช้ mock responses ต้องเชื่อม `POST /api/chat` กับ RAG engine จริง หรือเปลี่ยนเป็น LLM (เช่น OpenAI API)

4. **เพิ่มข้อมูล Enriched** — เมื่อ AI Model ส่ง speedKmh, trackId, directionDeg มาได้ → analytics จะเริ่มตรวจจับเหตุการณ์ผิดปกติอัตโนมัติ

5. **ใส่รูปภาพ CCTV** — แสดงภาพจากกล้องพร้อม Bounding Box โดยใช้ bbox (bboxX, bboxY, bboxWidth, bboxHeight)

6. **Authentication** — เพิ่มระบบ login สำหรับควบคุมการเข้าถึง (โดยเฉพาะข้อมูลป้ายทะเบียน)

ดูรายละเอียดเพิ่มเติมที่ `docs/ADVANCED_VISION_FEATURES_HANDOFF.md`

---

## Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4 |
| Backend | FastAPI, Uvicorn, WebSockets |
| Data Models | Pydantic v2 |
| Containerization | Docker, Docker Compose |
| ข้อมูลจำลอง | CSV (500 แถว) |

---

> **NT Vehicle Detection Analytics** — Chaengwattana Center Security Control
