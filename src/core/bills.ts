import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { Bill } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * The demo bills the agent pays and the dashboard shows. One source of truth in
 * config/bills.json (apps/web/src/data/bills.ts mirrors it for the browser).
 * A DemoBill is a Bill plus the funding currency to convert from and a human note.
 */
export interface DemoBill extends Bill {
  /** Local stablecoin to convert from before paying (e.g. "cNGN"). */
  fund?: string;
  note?: string;
}

export function loadBills(): DemoBill[] {
  const path = join(__dirname, "../../config/bills.json");
  const raw = JSON.parse(readFileSync(path, "utf8")) as { bills: DemoBill[] };
  return raw.bills;
}

export function getBill(id: string): DemoBill {
  const bills = loadBills();
  const bill = bills.find((b) => b.id === id);
  if (!bill) throw new Error(`Unknown bill "${id}". Known: ${bills.map((b) => b.id).join(", ")}`);
  return bill;
}
