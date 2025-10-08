import { getDB } from "./db";
import { normalizeCode, strip } from "./utils";
import type { SheetCandidate } from "./types";

// remove acentos e baixa para minúsculas
function norm(s: string) {
  return strip(s).toLowerCase();
}

export function searchCities(query: string, uf?: string) {
  const db = getDB();
  const q = norm(query);
  const list = db.cities.filter((c: any) => (uf ? c.uf === uf : true));


  // match por includes no nome e no alias/altNames (se houver)
  const hits = list
    .map((c) => {
      const name = norm(c.city_name);
      const score =
        (name.startsWith(q) ? 0 : 1) + (name.includes(q) ? 0 : 1) +
        (uf && c.uf !== uf ? 2 : 0);
      return { c, score };
    })
    .filter((x) => q.length === 0 ? true : norm(x.c.city_name).includes(q))
    .sort((a, b) => a.score - b.score)
    .slice(0, 50)
    .map((x) => x.c);

  return hits;
}

