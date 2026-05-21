"""
Rule-based analytics for enriched vehicle detections.

This is intentionally lightweight. It gives the next developer a stable place
to plug in model outputs from license-plate OCR, tracking, speed estimation,
accident detection, and anomaly detection without changing the API contract.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from math import fabs

from vision_schema import AdvancedEvent, VehicleDetection


SPEED_LIMIT_KMH = 90
LOOP_WINDOW_SECONDS = 15 * 60
LOOP_MIN_OBSERVATIONS = 3
SUDDEN_STOP_DROP_KMH = 35
SUDDEN_STOP_SECONDS = 6
STOPPED_SPEED_KMH = 2
STOPPED_WINDOW_SECONDS = 45
WRONG_WAY_TOLERANCE_DEG = 120


def _parse_ts(ts: str) -> datetime | None:
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except ValueError:
        return None


def _seconds_between(a: str, b: str) -> float | None:
    da = _parse_ts(a)
    db = _parse_ts(b)
    if not da or not db:
        return None
    return abs((db - da).total_seconds())


def _event_id(event_type: str, detection: VehicleDetection, suffix: str = "") -> str:
    key = detection.licensePlate or detection.trackId or detection.timestamp
    compact = "".join(ch for ch in key if ch.isalnum())[-12:]
    return f"{event_type}:{compact}:{suffix or detection.timestamp}"


def _direction_delta(a: float, b: float) -> float:
    return abs((a - b + 180) % 360 - 180)


def _vehicle_key(d: VehicleDetection) -> str | None:
    return d.trackId or d.licensePlate


def analyze_advanced_events(rows: list[VehicleDetection]) -> list[AdvancedEvent]:
    events: list[AdvancedEvent] = []
    ordered = sorted(rows, key=lambda r: r.timestamp)

    by_vehicle: dict[str, list[VehicleDetection]] = defaultdict(list)
    for row in ordered:
        key = _vehicle_key(row)
        if key:
            by_vehicle[key].append(row)

        if row.speedKmh is not None and row.speedKmh > SPEED_LIMIT_KMH:
            events.append(AdvancedEvent(
                id=_event_id("speeding", row),
                type="speeding",
                timestamp=row.timestamp,
                severity="medium" if row.speedKmh < SPEED_LIMIT_KMH + 30 else "high",
                title="Speeding vehicle",
                description=f"Vehicle speed is {row.speedKmh:.0f} km/h, above {SPEED_LIMIT_KMH} km/h.",
                confidence=0.74,
                evidence={"speedKmh": row.speedKmh, "limitKmh": SPEED_LIMIT_KMH},
                detection=row,
            ))

        if row.directionDeg is not None and row.expectedDirectionDeg is not None:
            delta = _direction_delta(row.directionDeg, row.expectedDirectionDeg)
            if delta >= WRONG_WAY_TOLERANCE_DEG:
                events.append(AdvancedEvent(
                    id=_event_id("wrong_way", row),
                    type="wrong_way",
                    timestamp=row.timestamp,
                    severity="high",
                    title="Wrong-way driving",
                    description=f"Heading differs from expected lane direction by {delta:.0f} degrees.",
                    confidence=0.78,
                    evidence={"directionDeg": row.directionDeg, "expectedDirectionDeg": row.expectedDirectionDeg, "deltaDeg": delta},
                    detection=row,
                ))

    for key, track in by_vehicle.items():
        if len(track) < 2:
            continue

        # Repeated observations in a short window can mean looping or suspicious circling.
        first = track[0]
        last = track[-1]
        span = _seconds_between(first.timestamp, last.timestamp)
        cameras = {d.cameraId for d in track if d.cameraId}
        if span is not None and span <= LOOP_WINDOW_SECONDS and len(track) >= LOOP_MIN_OBSERVATIONS:
            events.append(AdvancedEvent(
                id=_event_id("abnormal_looping", last, str(len(track))),
                type="abnormal_looping",
                timestamp=last.timestamp,
                severity="medium",
                title="Possible looping behavior",
                description="Same vehicle/track was observed repeatedly inside the monitoring window.",
                confidence=0.62 if len(cameras) < 2 else 0.72,
                evidence={"vehicleKey": key, "observations": len(track), "windowSeconds": span, "cameraCount": len(cameras)},
                detection=last,
            ))

        # Sudden speed drop and stopped state can be an accident precursor.
        for prev, cur in zip(track, track[1:]):
            if prev.speedKmh is None or cur.speedKmh is None:
                continue
            elapsed = _seconds_between(prev.timestamp, cur.timestamp)
            if elapsed is None or elapsed > SUDDEN_STOP_SECONDS:
                continue
            drop = prev.speedKmh - cur.speedKmh
            if drop >= SUDDEN_STOP_DROP_KMH and cur.speedKmh <= STOPPED_SPEED_KMH:
                events.append(AdvancedEvent(
                    id=_event_id("accident_suspected", cur),
                    type="accident_suspected",
                    timestamp=cur.timestamp,
                    severity="critical",
                    title="Possible accident or hard stop",
                    description="Vehicle speed dropped sharply to near zero in a short time window.",
                    confidence=0.68,
                    evidence={"previousSpeedKmh": prev.speedKmh, "currentSpeedKmh": cur.speedKmh, "dropKmh": drop, "elapsedSeconds": elapsed},
                    detection=cur,
                ))

        stopped = [d for d in track if d.speedKmh is not None and d.speedKmh <= STOPPED_SPEED_KMH]
        if len(stopped) >= 2:
            stopped_span = _seconds_between(stopped[0].timestamp, stopped[-1].timestamp)
            if stopped_span is not None and stopped_span >= STOPPED_WINDOW_SECONDS:
                events.append(AdvancedEvent(
                    id=_event_id("stopped_vehicle", stopped[-1], str(int(stopped_span))),
                    type="stopped_vehicle",
                    timestamp=stopped[-1].timestamp,
                    severity="medium",
                    title="Stopped vehicle",
                    description="Vehicle appears stopped for longer than the configured threshold.",
                    confidence=0.7,
                    evidence={"vehicleKey": key, "stoppedSeconds": stopped_span},
                    detection=stopped[-1],
                ))

        # Same plate with different tracks/cameras at nearly the same time is worth review.
        plates = {d.licensePlate for d in track if d.licensePlate}
        track_ids = {d.trackId for d in track if d.trackId}
        if plates and len(track_ids) > 1:
            events.append(AdvancedEvent(
                id=_event_id("abnormal_repeat_plate", last, str(len(track_ids))),
                type="abnormal_repeat_plate",
                timestamp=last.timestamp,
                severity="low",
                title="Repeated plate across tracks",
                description="Same plate appeared on multiple track IDs. Review OCR/tracking quality or possible duplicate plate.",
                confidence=0.55,
                evidence={"licensePlate": last.licensePlate, "trackIds": sorted(track_ids)},
                detection=last,
            ))

    deduped: dict[str, AdvancedEvent] = {}
    for event in events:
        deduped[event.id] = event
    return sorted(deduped.values(), key=lambda e: e.timestamp, reverse=True)
