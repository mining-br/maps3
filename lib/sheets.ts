// lib/sheets.ts
import { getDB } from "./db";
import type { SheetCandidate } from "./types";

// Normaliza: remove acentos, baixa para minúsculas e tira espaços extras
function norm(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/**
 * Busca folhas/cartas por nome de cidade e UF.
 * - `query`: nome (parcial) da cidade
 * - `uf`: UF opcional para restringir (ex.: "BA")
 */
export function searchSheets(query: string, uf?: string): SheetCandidate[] {
  const db = getDB();

  const q: string = norm(query || "");
  // Se vier UF, restringe; caso contrário usa tudo
  const list: SheetCandidate[] = db.cities.filter((c: SheetCandidate) =>
    uf ? c.uf === uf : true
  );

  // Se a busca estiver vazia, retorna primeiras 50 (já filtradas por UF)
  if (q.length === 0) {
    return list.slice(0, 50);
  }

  // Calcula "score" simples e mantém só as que contém o termo
  const hits: SheetCandidate[] = list
    .map((c: SheetCandidate) => {
      const name = norm(c.title ?? ""); // protege title undefined
      const score =
        (name.startsWith(q) ? 0 : 1) + (name.includes(q) ? 0 : 1);
      return { c, score };
    })
    // garante que existe title e que contém o termo
    .filter((x) => (x.c.title ? norm(x.c.title).includes(q) : false))
    .sort((a, b) => a.score - b.score)
    .slice(0, 50)
    .map((x) => x.c);

  return hits;
}

export default searchSheets;
