// lib/sheets.ts
import type { SheetCandidate } from "./types";
import { getDB } from "./db";
import { normalizeCode as norm } from "./utils";

type Hit = { c: SheetCandidate; score: number };

export function searchCities(query: string, uf?: string): SheetCandidate[] {
  const db = getDB();
  const q = norm(query);

  const list: SheetCandidate[] = db.cities.filter((c: SheetCandidate) =>
    uf ? c.uf === uf : true
  );

  const hits: SheetCandidate[] = list
    .map((c: SheetCandidate): Hit => {
      const name = norm(c.title || "");
      const score =
        (name.startsWith(q) ? 0 : 1) +
        (name.includes(q) ? 0 : 1) +
        (uf && c.uf !== uf ? 2 : 0);
      return { c, score };
    })
    .filter((x: Hit) =>
      q.length === 0 ? true : norm(x.c.title || "").includes(q)
    )
    .sort((a: Hit, b: Hit) => a.score - b.score)
    .slice(0, 50)
    .map((x: Hit) => x.c);

  return hits;
}
