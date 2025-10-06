// lib/db.ts
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { parse } from "csv-parse/sync";

type Row = { code: string; title?: string | null; uf?: string | null };

function normalizeCode(code: string) {
  if (!code) return code;
  let c = code.trim().toUpperCase().replace(/\s+/g, "");
  c = c.replace(/\./g, "-");
  c = c.replace(/--+/g, "-");
  return c;
}

function readCsvSmart(filePath: string): Row[] {
  const raw = fs.readFileSync(filePath);
  // tenta "," e ";" como separador
  for (const delimiter of [",", ";"]) {
    try {
      const rec: any[] = parse(raw, {
        columns: true,
        skip_empty_lines: true,
        delimiter,
        bom: true,
        trim: true,
      });
      if (rec?.length) {
        return rec.map((r) => {
          const codeRaw = r.indNomencl || r.code || r.indice || r["indNomencl"];
          const titleRaw = r.nome || r.title || r["Folha"] || r["nomeFolha"];
          const ufRaw = r.uf || r.UF || r.estado;
          const code = normalizeCode(String(codeRaw || "").trim());
          return {
            code,
            title: String(titleRaw || "").trim() || null,
            uf: ufRaw ? String(ufRaw).trim().toUpperCase() : null,
          };
        });
      }
    } catch {
      // tenta próximo delimitador
    }
  }
  // fallback auto
  const rec: any[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true,
  });
  return rec.map((r) => {
    const codeRaw = r.indNomencl || r.code || r.indice || r["indNomencl"];
    const titleRaw = r.nome || r.title || r["Folha"] || r["nomeFolha"];
    const ufRaw = r.uf || r.UF || r.estado;
    const code = normalizeCode(String(codeRaw || "").trim());
    return {
      code,
      title: String(titleRaw || "").trim() || null,
      uf: ufRaw ? String(ufRaw).trim().toUpperCase() : null,
    };
  });
}

function bootstrapInMemory(db: InstanceType<typeof Database>) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sheets250k (id INTEGER PRIMARY KEY, code TEXT, title TEXT, uf TEXT);
    CREATE TABLE IF NOT EXISTS sheets100k (id INTEGER PRIMARY KEY, code TEXT, title TEXT, uf TEXT);
    CREATE TABLE IF NOT EXISTS sheets50k  (id INTEGER PRIMARY KEY, code TEXT, title TEXT, uf TEXT);
    CREATE INDEX IF NOT EXISTS idx_250_code ON sheets250k(code);
    CREATE INDEX IF NOT EXISTS idx_100_code ON sheets100k(code);
    CREATE INDEX IF NOT EXISTS idx_50_code  ON sheets50k(code);
  `);

  const dataDir = path.join(process.cwd(), "data");
  const p250 = path.join(dataDir, "carta250mil.csv");
  const p100 = path.join(dataDir, "cartacemmil.csv");

  if (fs.existsSync(p250)) {
    const rows = readCsvSmart(p250).filter((r) => r.code);
    const ins = db.prepare(`INSERT INTO sheets250k(code, title, uf) VALUES (?, ?, ?);`);
    const tx = db.transaction((arr: Row[]) => {
      for (const r of arr) ins.run(r.code, r.title, r.uf);
    });
    tx(rows);
  }

  if (fs.existsSync(p100)) {
    const rows = readCsvSmart(p100).filter((r) => r.code);
    const ins = db.prepare(`INSERT INTO sheets100k(code, title, uf) VALUES (?, ?, ?);`);
    const tx = db.transaction((arr: Row[]) => {
      for (const r of arr) ins.run(r.code, r.title, r.uf);
    });
    tx(rows);
  }
}

let db: InstanceType<typeof Database> | null = null;

export function getDB() {
  if (db) return db;

  const file = path.join(process.cwd(), "data", "atlas.db");
  if (fs.existsSync(file)) {
    db = new Database(file, { fileMustExist: true });
    return db;
  }

  // Serverless sem atlas.db → usa DB em memória e carrega os CSVs
  db = new Database(":memory:");
  bootstrapInMemory(db);
  return db;
}
