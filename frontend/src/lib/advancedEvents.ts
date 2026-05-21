import type { AdvancedEvent, AdvancedEventType, Lang, VehicleDetection } from "@/types";

export function detectionKey(d: Pick<VehicleDetection, "trackId" | "licensePlate" | "timestamp">): string {
  return d.trackId || d.licensePlate || d.timestamp;
}

export function eventDetectionKey(event: AdvancedEvent): string | null {
  return event.detection ? detectionKey(event.detection) : null;
}

export function eventTypeLabel(type: AdvancedEventType, lang: Lang): string {
  const en: Record<AdvancedEventType, string> = {
    accident_suspected: "Accident",
    abnormal_looping: "Looping",
    abnormal_repeat_plate: "Repeat plate",
    sudden_stop: "Sudden stop",
    stopped_vehicle: "Stopped",
    speeding: "Speeding",
    wrong_way: "Wrong way",
    unsafe_driving: "Unsafe driving",
  };
  const th: Record<AdvancedEventType, string> = {
    accident_suspected: "อุบัติเหตุ",
    abnormal_looping: "ขับวน",
    abnormal_repeat_plate: "ป้ายซ้ำ",
    sudden_stop: "หยุดกะทันหัน",
    stopped_vehicle: "จอดนิ่ง",
    speeding: "ขับเร็ว",
    wrong_way: "ย้อนศร",
    unsafe_driving: "ขับขี่เสี่ยง",
  };
  return lang === "en" ? en[type] : th[type];
}

export function severityColor(severity: AdvancedEvent["severity"]) {
  switch (severity) {
    case "critical":
      return { background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" };
    case "high":
      return { background: "#ffedd5", color: "#9a3412", border: "1px solid #fed7aa" };
    case "medium":
      return { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" };
    default:
      return { background: "#e0f2fe", color: "#075985", border: "1px solid #bae6fd" };
  }
}
