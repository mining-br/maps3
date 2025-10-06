import Fuse from "fuse.js";
import { getDB } from "./db";
import { normalizeCode } from "./utils";
import type { SheetCandidate } from "./types";

type Row = { id?: number; code: string; title?: string; uf?: string };

function readAll(table: "sheets250k" | "sheets100k" | "sheets50k"): Row[] {
  const db = getDB();
  const stmt = db.prepare(`SELECT id, code, title, uf FROM ${table};`);
  return stmt.all() as Row[];
}

export async function resolveSheetsForPlace(city: string, uf: string): Promise<SheetCandidate[]> {
  const rows250 = readAll("sheets250k");
  const rows100 = readAll("sheets100k");
  const rows50  = readAll("sheets50k");

  const fuseOptions = { keys: ["title", "code", "uf"], threshold: 0.3 };
  const fuse250 = new Fuse(rows250, fuseOptions);
  const fuse100 = new Fuse(rows100, fuseOptions);
  const fuse50  = new Fuse(rows50,  fuseOptions);

  const query = `${city} ${uf}`;

  const top250 = fuse250.search(query, { limit: 8 }).map(r => ({
    code: normalizeCode(r.item.code),
    title: r.item.title,
    uf: r.item.uf,
    scale: "1:250000" as const,
  }));
  const top100 = fuse100.search(query, { limit: 12 }).map(r => ({
    code: normalizeCode(r.item.code),
    title: r.item.title,
    uf: r.item.uf,
    scale: "1:100000" as const,
  }));
  const top50  = fuse50.search(query,  { limit: 15 }).map(r => ({
    code: normalizeCode(r.item.code),
    title: r.item.title,
    uf: r.item.uf,
    scale: "1:50000" as const,
  }));

  const seen = new Set<string>();
  const pushUnique = (arr: SheetCandidate[], it: SheetCandidate) => {
    const k = `${it.code}|${it.scale}`;
    if (!seen.has(k)) {
      seen.add(k);
      arr.push(it);
    }
  };

  const result: SheetCandidate[] = [];
  for (const i of top250) pushUnique(result, i);
  for (const i of top100) pushUnique(result, i);
  for (const i of top50)  pushUnique(result, i);

  return result;
}
