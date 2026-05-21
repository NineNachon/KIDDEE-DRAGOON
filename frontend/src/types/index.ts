export interface VehicleDetection {
  timestamp: string;
  vehicleType: string;
  brand: string;
  colorLabel: string;
  colorHex: string;
  vehicleModel?: string;
  licensePlate?: string;
  plateConfidence?: number;
  cameraId?: string;
  laneId?: string;
  trackId?: string;
  frameId?: string;
  confidence?: number;
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  speedKmh?: number;
  directionDeg?: number;
  expectedDirectionDeg?: number;
  locationX?: number;
  locationY?: number;
}

export type AdvancedEventType =
  | "accident_suspected"
  | "abnormal_looping"
  | "abnormal_repeat_plate"
  | "sudden_stop"
  | "stopped_vehicle"
  | "speeding"
  | "wrong_way"
  | "unsafe_driving";

export interface AdvancedEvent {
  id: string;
  type: AdvancedEventType;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  confidence: number;
  evidence: Record<string, unknown>;
  detection?: VehicleDetection;
}

export interface WSMessage {
  type: "detection" | "history";
  data: VehicleDetection | VehicleDetection[];
  clients?: number;
  count?: number;
}

export type Lang = "th" | "en";
export type LiveSpeed = "slow" | "normal" | "fast";

export interface FilterOption {
  value: string;
  label: string;
  hex?: string;
}
