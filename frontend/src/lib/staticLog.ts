import type { AdvancedEvent, VehicleDetection } from "@/types";

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  values.push(current);
  return values;
}

function parseCsv(csv: string): Record<string, string>[] {
  const lines = csv.split(/\r?\n/).filter(line => line.trim().length > 0);
  const headers = parseCsvLine(lines[0] || "");

  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = values[index] || "";
      return row;
    }, {});
  });
}

function normalizeRow(row: Record<string, string>): VehicleDetection {
  return {
    timestamp: row.timestamp,
    vehicleType: row.vehicleType,
    brand: row.brand,
    colorLabel: row.colorLabel,
    colorHex: row.colorHex,
    vehicleModel: row.vehicleModel || row.model || undefined,
    licensePlate: row.licensePlate || undefined,
    eventFlag: row.eventFlag || row.Event || undefined,
  };
}

export async function loadStaticLog(): Promise<VehicleDetection[]> {
  const res = await fetch("/log.csv", { cache: "no-store" });
  if (!res.ok) throw new Error("Unable to load static log.csv");
  const csv = await res.text();
  return parseCsv(csv).map(normalizeRow);
}

export function staticAdvancedEvents(rows: VehicleDetection[]): AdvancedEvent[] {
  return rows
    .filter(row => row.eventFlag && ["yes", "true", "1", "y"].includes(row.eventFlag.trim().toLowerCase()))
    .map(row => ({
      id: `accident_suspected:${row.licensePlate || row.timestamp}:source-log`,
      type: "accident_suspected",
      timestamp: row.timestamp,
      severity: "critical",
      title: "Source log flagged event",
      description: "The source CSV marks this detection as an event.",
      confidence: 0.8,
      evidence: { eventFlag: row.eventFlag },
      detection: row,
    }));
}
