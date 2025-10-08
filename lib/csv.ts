// lib/csv.ts
import fs from "node:fs";
import { parse } from "csv-parse/sync";

export type SheetRow = {
  code: string;
  title: string;
  uf: string;
  [k: string]: unknown;
};

export function readCsvSmart(filePath: string): SheetRow[] {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf8");

  // Detecta separador (preferência por ';' quando em maioria)
  const count = (s: string, ch: string) => (s.match(new RegExp(`\\${ch}`, "g")) || []).length;
  const semi = count(raw, ";");
  const comma = count(raw, ",");
  const delimiter = semi > comma ? ";" : ",";

  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    delimiter,
    relax_column_count: true,
    bom: true,
    trim: true,
  }) as Record<string, unknown>[];

  return records
    .map((r) => {
      const code = normalizeCode(
        (r["indNomencl"] || r["code"] || r["codigo"] || r["código"] || "").toString()
      );
      const title = (r["nome"] || r["title"] || r["titulo"] || r["título"] || "").toString().trim();
      const uf = (r["uf"] || r["UF"] || "").toString().toUpperCase();
      return { code, title, uf, ...r } as SheetRow;
    })
    .filter((r) => r.code || r.title);
}

export function normalizeCode(code: string) {
  if (!code) return "";
  let s = code
    .toUpperCase()
    .replace(/[.\s_]+/g, "-")
    .replace(/–/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
  // Normalização leve para padrões SB-24-V-D-IV etc.
  // (deixa como está se já estiver correto)
  return s;
}
