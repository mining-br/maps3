// lib/sheets.ts
import { getDB } from "./db";
import type { SheetCandidate } from "./types";

// Função auxiliar para normalizar texto (minúsculas + sem acentos)
function norm(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function searchCity(query: string, uf?: string): SheetCandidate[] {
  const db = getDB();
  const q = norm(query);

  // filtra cidades pelo UF (se informado)
  const list = db.cities.filter((c) =>
    uf ? c.uf?.toUpperCase() === uf.toUpperCase() : true
  );

  // procura correspondência no nome normalizado
  const hits = list.filter((c) => norm(c.title).includes(q));

  // se nada encontrado, retorna lista vazia
  return hits.slice(0, 50);
}
