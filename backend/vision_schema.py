"""
Shared data contracts for future computer-vision features.

The current project streams rows from log.csv. These models define the richer
payload that a real detector/OCR/tracker pipeline should emit later.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


EventType = Literal[
    "accident_suspected",
    "abnormal_looping",
    "abnormal_repeat_plate",
    "sudden_stop",
    "stopped_vehicle",
    "speeding",
    "wrong_way",
    "unsafe_driving",
]


class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float


class VehicleDetection(BaseModel):
    timestamp: str
    vehicleType: str
    brand: str
    colorLabel: str
    colorHex: str

    # Optional enrichments from future models.
    vehicleModel: str | None = None
    licensePlate: str | None = None
    eventFlag: str | None = None
    plateConfidence: float | None = Field(default=None, ge=0, le=1)
    cameraId: str | None = None
    laneId: str | None = None
    trackId: str | None = None
    frameId: str | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)
    bbox: BoundingBox | None = None

    # Motion/trajectory fields for behavior and anomaly analytics.
    speedKmh: float | None = None
    directionDeg: float | None = None
    expectedDirectionDeg: float | None = None
    locationX: float | None = None
    locationY: float | None = None


class AdvancedEvent(BaseModel):
    id: str
    type: EventType
    timestamp: str
    severity: Literal["low", "medium", "high", "critical"]
    title: str
    description: str
    confidence: float = Field(ge=0, le=1)
    evidence: dict[str, Any] = Field(default_factory=dict)
    detection: VehicleDetection | None = None


OPTIONAL_FIELDS = {
    "vehicleModel",
    "eventFlag",
    "licensePlate",
    "plateConfidence",
    "cameraId",
    "laneId",
    "trackId",
    "frameId",
    "confidence",
    "speedKmh",
    "directionDeg",
    "expectedDirectionDeg",
    "locationX",
    "locationY",
}


FLOAT_FIELDS = {
    "plateConfidence",
    "confidence",
    "speedKmh",
    "directionDeg",
    "expectedDirectionDeg",
    "locationX",
    "locationY",
}


def _coerce_float(value: str | None) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except ValueError:
        return None


def parse_detection_row(row: dict[str, str]) -> VehicleDetection:
    """Parse current CSV rows plus future optional enrichment columns."""
    payload: dict[str, Any] = {
        "timestamp": row["timestamp"],
        "vehicleType": row["vehicleType"],
        "brand": row["brand"],
        "colorLabel": row["colorLabel"],
        "colorHex": row["colorHex"],
    }

    if row.get("model") and not row.get("vehicleModel"):
        payload["vehicleModel"] = row["model"]

    if row.get("Event") and not row.get("eventFlag"):
        payload["eventFlag"] = row["Event"]

    for field in OPTIONAL_FIELDS:
        if field not in row:
            continue
        payload[field] = _coerce_float(row[field]) if field in FLOAT_FIELDS else (row[field] or None)

    if all(k in row and row[k] not in ("", None) for k in ("bboxX", "bboxY", "bboxWidth", "bboxHeight")):
        payload["bbox"] = {
            "x": _coerce_float(row.get("bboxX")) or 0,
            "y": _coerce_float(row.get("bboxY")) or 0,
            "width": _coerce_float(row.get("bboxWidth")) or 0,
            "height": _coerce_float(row.get("bboxHeight")) or 0,
        }

    return VehicleDetection(**payload)
