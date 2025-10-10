// lib/sheets.ts
// Busca “candidatos” de folhas pelo nome da cidade (texto solto) com filtro opcional por UF.

import { getDB } from "./db";

// Tipo local — não dependemos mais de ./types
export type SheetCandidate = {
  code: string;
  title?: string;
  uf?: string;
  scale?: "1:250000" | "1:100000" | "1:50000";
};

// Normaliza: remove acentos, minúsculas e espaços extras
function norm(s: string = ""): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Retorna até 50 candidatos com match no nome da cidade.
 * - Se `uf` vier, prioriza resultados daquela UF.
 * - Ordena por score simples (prefixo conta mais).
 */
export function searchSheetsByCityName(
  uf: string | undefined,
  query: string
): SheetCandidate[] {
  const db = getDB();
  const q = norm(query);

  // Filtra por UF se fornecida
  const list = db.cities.filter((c: any) => (uf ? c.uf === uf : true));

  // Calcula score simples por nome
  const hits = list
    .map((c: any) => {
      const name = norm(c.title || "");
      const score =
        (name.startsWith(q) ? 0 : 1) +
        (name.includes(q) ? 0 : 1) +
        (uf && c.uf !== uf ? 2 : 0);
      return { c, score };
    })
    // mantém apenas os que batem o texto (quando query não vazia)
    .filter((x: { c: any; score: number }) =>
      q.length === 0 ? true : norm(x.c.title || "").includes(q)
    )
    .sort((a: { score: number }, b: { score: number }) => a.score - b.score)
    .slice(0, 50)
    .map((x: { c: any }) => x.c as SheetCandidate);

  return hits;
}
