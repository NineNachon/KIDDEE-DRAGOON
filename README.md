# NT CCTV AI Camera

Vehicle Detection Analytics Dashboard สำหรับแสดงผลข้อมูลการตรวจจับยานพาหนะจากไฟล์ `log.csv` พร้อมกราฟสรุป, ตาราง log, filter, alert เหตุการณ์ และหน้าตา dashboard สำหรับเดโมระบบ CCTV/AI Camera

โปรเจกต์นี้รองรับ 2 วิธีใช้งาน:

- **Vercel ที่เดียวจบ**: deploy เฉพาะ `frontend` ได้ทันที โดย frontend โหลดข้อมูลจาก `frontend/public/log.csv`
- **Full stack local / Docker**: ใช้ Next.js frontend + FastAPI backend + WebSocket สำหรับจำลอง live stream

## สารบัญ

- [ฟีเจอร์หลัก](#ฟีเจอร์หลัก)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [Deploy บน Vercel](#deploy-บน-vercel)
- [รันในเครื่องแบบ frontend อย่างเดียว](#รันในเครื่องแบบ-frontend-อย่างเดียว)
- [รันในเครื่องแบบ full stack](#รันในเครื่องแบบ-full-stack)
- [รันด้วย Docker Compose](#รันด้วย-docker-compose)
- [รูปแบบข้อมูล CSV](#รูปแบบข้อมูล-csv)
- [Backend API](#backend-api)
- [หมายเหตุสำคัญ](#หมายเหตุสำคัญ)

## ฟีเจอร์หลัก

- Dashboard สรุปจำนวนยานพาหนะทั้งหมด
- กราฟสีรถและแนวโน้มตามช่วงเวลา
- อันดับยี่ห้อรถยอดนิยม
- สัดส่วนประเภทรถ พร้อมสีแยกตามประเภท
- ตาราง Detection Log พร้อม search, sort, pagination และ export CSV
- Filter ตามประเภทรถ, ยี่ห้อ, สี, รุ่นรถ, จังหวัดป้ายทะเบียน และเหตุการณ์
- Highlight แถว log ด้วยสีตามประเภทรถ
- แถวที่มีเหตุการณ์จะเน้นสีแดง
- Alert อุบัติเหตุ แสดงหลังเปิดหน้าเว็บประมาณ 10 วินาที
- Dark mode
- รองรับทั้งข้อมูล static จาก CSV และ backend live stream

## โครงสร้างโปรเจกต์

```txt
NT CCTV AI Camera/
├── backend/
│   ├── main.py              # FastAPI server + WebSocket + static frontend serving
│   ├── analytics.py         # วิเคราะห์ event จากข้อมูล vehicle detection
│   ├── rag.py               # mock/simple chatbot data query
│   ├── vision_schema.py     # Pydantic schema และ CSV parser
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── public/
│   │   └── log.csv          # CSV สำหรับ Vercel/static mode
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   ├── package.json
│   └── next.config.mjs
├── docs/
├── log.csv                  # CSV สำหรับ backend/full stack mode
├── Dockerfile               # single-service Docker สำหรับ Railway/containers
├── docker-compose.yml       # frontend + backend แยก service
├── netlify.toml
└── README.md
```

## Deploy บน Vercel

วิธีนี้ง่ายที่สุด และไม่ต้องมี backend แยก

### 1. Import project

ไปที่ Vercel แล้วเลือก GitHub repo นี้

### 2. ตั้งค่า Build

ตั้งค่าตามนี้:

```txt
Framework Preset: Next.js
Root Directory: frontend
Build Command: npm run build
Output Directory: เว้นว่าง
Install Command: npm install
```

ห้ามตั้ง `Output Directory` เป็น `public`

### 3. Environment Variables

ถ้าต้องการใช้ Vercel ที่เดียวจบ ไม่ต้องใส่ environment variables

ถ้าเคยใส่ตัวแปรเหล่านี้ไว้ ให้ลบออก:

```txt
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_WS_URL
```

เมื่อไม่มี env สองตัวนี้ frontend จะเข้า **static mode** อัตโนมัติ และโหลดข้อมูลจาก:

```txt
frontend/public/log.csv
```

### 4. Deploy

กด Deploy ได้เลย

ถ้า deploy แล้วข้อมูลไม่อัปเดต ให้เช็กว่าไฟล์ `frontend/public/log.csv` เป็นไฟล์ล่าสุดหรือไม่

## รันในเครื่องแบบ frontend อย่างเดียว

เหมาะกับการเช็กหน้า dashboard แบบเดียวกับที่ deploy บน Vercel

```bash
cd frontend
npm install
npm run dev
```

เปิด:

```txt
http://localhost:3000
```

โหมดนี้จะอ่านข้อมูลจาก:

```txt
frontend/public/log.csv
```

## รันในเครื่องแบบ full stack

ใช้เมื่ออยากทดสอบ backend, REST API, WebSocket และ live stream

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend จะอ่านข้อมูลจาก `log.csv` ที่ root project

### Frontend

เปิด terminal อีกหน้าหนึ่ง:

```bash
cd frontend
npm install
npm run dev
```

ถ้าต้องการให้ frontend ต่อ backend local ให้สร้าง `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/stream
```

เปิด:

```txt
http://localhost:3000
```

## รันด้วย Docker Compose

```bash
docker-compose up --build
```

URL:

```txt
Frontend: http://localhost:3000
Backend:  http://localhost:8000
```

## Single-Service Docker

มี `Dockerfile` ที่ root สำหรับ deploy แบบ service เดียว เช่น Railway หรือ container host อื่น ๆ

แนวคิดคือ:

- build frontend เป็น static output
- copy static frontend เข้า container backend
- FastAPI เสิร์ฟทั้งหน้าเว็บ, API และ WebSocket ใน service เดียว

ถ้าใช้ Railway แบบ Docker:

```txt
Root Directory: /
Builder: Dockerfile
Build Command: เว้นว่าง
Start Command: เว้นว่าง
```

## รูปแบบข้อมูล CSV

ไฟล์ CSV ปัจจุบันใช้คอลัมน์ประมาณนี้:

```csv
timestamp,vehicleType,brand,colorLabel,colorHex,model,licensePlate,Event
2026-05-20T08:01:00.000Z,รถจักรยานยนต์,Nissan,ขาว,#FFFFFF,Click 160,1ฐต นนทบุรี 172,No
```

### คอลัมน์หลัก

| คอลัมน์ | ความหมาย |
|---|---|
| `timestamp` | เวลาที่ตรวจจับ เช่น `2026-05-20T08:01:00.000Z` |
| `vehicleType` | ประเภทรถ เช่น `รถเก๋ง`, `รถกระบะ`, `รถจักรยานยนต์`, `รถตู้`, `รถบัส` |
| `brand` | ยี่ห้อรถ เช่น `Toyota`, `Honda`, `Nissan` |
| `colorLabel` | ชื่อสี เช่น `ขาว`, `ดำ`, `แดง` |
| `colorHex` | รหัสสี เช่น `#FFFFFF` |
| `model` | รุ่นรถ เช่น `Vios`, `D-Max`, `Almera` |
| `licensePlate` | ป้ายทะเบียน ระบบจะดึงจังหวัดท้ายป้ายไปใช้ใน filter |
| `Event` | ถ้าเป็น `Yes` จะสร้าง alert/event บน dashboard |

### การอัปเดตข้อมูลสำหรับ Vercel

ถ้า deploy แบบ Vercel ที่เดียวจบ ต้องอัปเดตไฟล์นี้:

```txt
frontend/public/log.csv
```

ถ้าใช้ backend/full stack ต้องอัปเดตไฟล์นี้:

```txt
log.csv
```

ถ้าต้องการให้ทั้งสองโหมดใช้ข้อมูลเดียวกัน ให้ copy ไฟล์ให้ตรงกันทั้งสองตำแหน่ง

## Backend API

ใช้เฉพาะโหมด full stack หรือ single-service Docker

| Method | Path | รายละเอียด |
|---|---|---|
| `GET` | `/health` | เช็กสถานะ backend |
| `GET` | `/api/history` | อ่าน detection ทั้งหมดจาก CSV |
| `GET` | `/api/stats` | สถิติรวมตามประเภท, ยี่ห้อ และสี |
| `GET` | `/api/advanced-events` | รายการ event ที่วิเคราะห์ได้ |
| `POST` | `/api/chat` | mock/simple chatbot response |
| `WS` | `/ws/stream` | WebSocket stream สำหรับส่ง detection ไปหน้าเว็บ |

ตัวอย่าง:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/history
curl http://localhost:8000/api/advanced-events
```

## โหมดการทำงานของ Frontend

Frontend เลือกโหมดจาก environment variables

### Static mode

ถ้าไม่มี env:

```txt
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_WS_URL
```

ระบบจะอ่านข้อมูลจาก:

```txt
/log.csv
```

ซึ่งมาจาก `frontend/public/log.csv`

โหมดนี้เหมาะกับ Vercel ที่เดียวจบ

### Backend mode

ถ้ามี env:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/stream
```

ระบบจะต่อ backend เพื่อใช้ REST API และ WebSocket

โหมดนี้เหมาะกับ local full stack, Docker Compose หรือ backend ที่ deploy แยก

## Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4 |
| Backend | FastAPI, Uvicorn, WebSocket |
| Data | CSV |
| Deploy ง่ายสุด | Vercel static mode |
| Deploy full stack | Docker Compose / single-service Docker |

## หมายเหตุสำคัญ

- Vercel ที่เดียวจบจะไม่มี backend จริงและไม่มี WebSocket จริง แต่ dashboard ใช้งานได้จาก `log.csv`
- ถ้าต้องการ live stream จริง ควรใช้ full stack mode หรือ deploy backend เพิ่ม
- Alert จะแสดงหลังเปิดหน้าเว็บประมาณ 10 วินาที หากมี `Event=Yes`
- Filter ป้ายทะเบียนใช้ “จังหวัด” ที่อยู่ท้ายค่า `licensePlate`
- ถ้าเปลี่ยนข้อมูล CSV แล้ว deploy บน Vercel ให้ commit/push `frontend/public/log.csv` ด้วย

## คำสั่งที่ใช้บ่อย

```bash
# frontend dev
cd frontend
npm run dev

# frontend build
cd frontend
npm run build

# backend dev
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# docker compose
docker-compose up --build
```

---

NT Vehicle Detection Analytics Dashboard
