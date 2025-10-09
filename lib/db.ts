// lib/db.ts
import type { SheetCandidate } from "./types";

// IMPORTA O JSON ESTÁTICO (coloque seu arquivo em /data/cities.json)
import rawCities from "../data/cities.json";

// Tipo interno do DB
type DB = { cities: SheetCandidate[] };

let cache: DB | null = null;

function normalizeUF(v: unknown): string | undefined {
  const s = String(v ?? "").trim().toUpperCase();
  return s ? s : undefined;
}
function normalizeTitle(v: unknown): string {
  return String(v ?? "").trim();
}
function normalizeCode(v: unknown): string {
  return String(v ?? "").trim();
}

/**
 * Aceita diferentes nomes de campos vindos do JSON:
 *  - code | codigo | id
 *  - title | city_name | nome | name
 *  - uf | estado | state
 *  - scale | escala
 */
function mapCity(x: any): SheetCandidate {
  return {
    code:
      normalizeCode(x?.code) ||
      normalizeCode(x?.codigo) ||
      normalizeCode(x?.id) ||
      "",
    title:
      normalizeTitle(x?.title) ||
      normalizeTitle(x?.city_name) ||
      normalizeTitle(x?.nome) ||
      normalizeTitle(x?.name) ||
      "",
    uf: normalizeUF(x?.uf ?? x?.estado ?? x?.state),
    scale: x?.scale ?? x?.escala,
  };
}

export function getDB(): DB {
  if (cache) return cache;

  // rawCities deve ser um array de objetos
  const arr = Array.isArray(rawCities) ? rawCities : [];
  const cities: SheetCandidate[] = arr.map(mapCity).filter((c) => c.title);

  cache = { cities };
  return cache;
}
