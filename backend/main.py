"""
NT Vehicle Detection — FastAPI WebSocket Streamer

Reads log.csv row-by-row and broadcasts JSON payloads
to all connected WebSocket clients at a configurable rate.
"""

import asyncio
import csv
import os
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from analytics import analyze_advanced_events
from rag import VehicleRAG
from vision_schema import parse_detection_row

# ── Config ──────────────────────────────────────────────────────
CSV_PATH = Path(os.environ.get("CSV_PATH", Path(__file__).resolve().parent.parent / "log.csv"))
DEFAULT_DELAY_MS = 40  # ~25 FPS


# ── Connection Manager ─────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active: set[WebSocket] = set()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.add(ws)

    def disconnect(self, ws: WebSocket):
        self.active.discard(ws)

    async def broadcast(self, payload: dict):
        dead: list[WebSocket] = []
        for ws in list(self.active):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.active.discard(ws)


manager = ConnectionManager()
delay_ms: int = DEFAULT_DELAY_MS

# ── RAG Engine ─────────────────────────────────────────────────
rag = VehicleRAG()


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    answer: str


# ── CSV Loader ──────────────────────────────────────────────────
def load_csv() -> list[dict]:
    rows = []
    with open(CSV_PATH, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows.append(parse_detection_row(row).model_dump(exclude_none=True))
    return rows


def load_detections():
    rows = []
    with open(CSV_PATH, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows.append(parse_detection_row(row))
    return rows


# ── Background Streamer ────────────────────────────────────────
async def csv_streamer():
    global delay_ms
    rows = load_csv()
    while True:
        for row in rows:
            await manager.broadcast({
                "type": "detection",
                "data": row,
                "clients": len(manager.active),
            })
            await asyncio.sleep(delay_ms / 1000.0)


# ── Lifespan ────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Build RAG index on startup
    global rag
    rag = VehicleRAG()
    task = asyncio.create_task(csv_streamer())
    yield
    task.cancel()


# ── FastAPI App ────────────────────────────────────────────────
app = FastAPI(title="NT Vehicle Detection API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.websocket("/ws/stream")
async def ws_stream(ws: WebSocket):
    global delay_ms
    await manager.connect(ws)
    # Send full history on connect
    history = load_csv()
    await ws.send_json({"type": "history", "data": history, "count": len(history)})
    try:
        while True:
            msg = await ws.receive_json()
            if msg.get("action") == "set_delay":
                delay_ms = max(10, min(5000, msg.get("delay_ms", DEFAULT_DELAY_MS)))
    except WebSocketDisconnect:
        manager.disconnect(ws)


@app.get("/api/history")
async def get_history():
    data = load_csv()
    return {"data": data, "count": len(data)}


@app.get("/api/stats")
async def get_stats():
    data = load_csv()
    type_counts: dict[str, int] = {}
    brand_counts: dict[str, int] = {}
    color_counts: dict[str, int] = {}
    for row in data:
        type_counts[row["vehicleType"]] = type_counts.get(row["vehicleType"], 0) + 1
        brand_counts[row["brand"]] = brand_counts.get(row["brand"], 0) + 1
        color_counts[row["colorLabel"]] = color_counts.get(row["colorLabel"], 0) + 1
    return {
        "total": len(data),
        "types": type_counts,
        "brands": brand_counts,
        "colors": color_counts,
    }


@app.get("/api/advanced-events")
async def get_advanced_events():
    detections = load_detections()
    events = analyze_advanced_events(detections)
    return {
        "events": [event.model_dump(exclude_none=True) for event in events],
        "count": len(events),
        "note": "Events require enriched fields such as licensePlate, trackId, speedKmh, directionDeg, and cameraId.",
    }


@app.get("/health")
async def health():
    return {"status": "ok", "clients": len(manager.active), "delay_ms": delay_ms}


@app.post("/api/chat")
async def chat(req: ChatRequest):
    answer = rag.query(req.message)
    return ChatResponse(answer=answer)
