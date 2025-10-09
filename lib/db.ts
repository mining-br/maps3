// lib/db.ts
import type { SheetCandidate } from "./types";
// Use o alias "@/": aponta para a raiz do projeto (conforme seu tsconfig)
import rawCities from "@/data/cities.json";

type DB = { cities: SheetCandidate[] };

let cache: DB | null = null;

function normalizeUF(v: unknown): string | undefined {
  const s = String(v ?? "").trim().toUpperCase();
  return s || undefined;
}
function normalizeTitle(v: unknown): string {
  return String(v ?? "").trim();
}
function normalizeCode(v: unknown): string {
  return String(v ?? "").trim();
}

// aceita possíveis nomes alternativos se seu JSON real tiver outras chaves
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
    scale: (x?.scale ?? x?.escala) as SheetCandidate["scale"],
  };
}

export function getDB(): DB {
  if (cache) return cache;

  const arr = Array.isArray(rawCities) ? rawCities : [];
  const cities: SheetCandidate[] = arr.map(mapCity).filter((c) => c.title);
  cache = { cities };
  return cache;
}

