import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { readCsvSmart } from "../lib/csv";
import { normalizeCode } from "../lib/utils";

const root = process.cwd();
const dataDir = path.join(root, "data");
const dbFile = path.join(dataDir, "atlas.db");

fs.mkdirSync(dataDir, { recursive: true });

console.log(">> Abrindo DB:", dbFile);
const db = new Database(dbFile);

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS sheets250k (
    id INTEGER PRIMARY KEY,
    code TEXT NOT NULL,
    title TEXT,
    uf TEXT
  );
  CREATE TABLE IF NOT EXISTS sheets100k (
    id INTEGER PRIMARY KEY,
    code TEXT NOT NULL,
    title TEXT,
    uf TEXT
  );
  CREATE TABLE IF NOT EXISTS sheets50k (
    id INTEGER PRIMARY KEY,
    code TEXT NOT NULL,
    title TEXT,
    uf TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_250_code ON sheets250k(code);
  CREATE INDEX IF NOT EXISTS idx_250_title ON sheets250k(title);
  CREATE INDEX IF NOT EXISTS idx_250_uf ON sheets250k(uf);
  CREATE INDEX IF NOT EXISTS idx_100_code ON sheets100k(code);
  CREATE INDEX IF NOT EXISTS idx_100_title ON sheets100k(title);
  CREATE INDEX IF NOT EXISTS idx_100_uf ON sheets100k(uf);
  CREATE INDEX IF NOT EXISTS idx_50_code ON sheets50k(code);
  CREATE INDEX IF NOT EXISTS idx_50_title ON sheets50k(title);
  CREATE INDEX IF NOT EXISTS idx_50_uf ON sheets50k(uf);
`);

function loadCsvTo(table: "sheets250k"|"sheets100k", file: string){
  if (!fs.existsSync(file)) {
    console.warn("!! CSV não encontrado, pulando:", file);
    return;
  }
  console.log(">> Lendo CSV:", file);
  const rows = readCsvSmart(file);
  const insert = db.prepare(`INSERT INTO ${table}(code, title, uf) VALUES (@code, @title, @uf);`);
  const tx = db.transaction((records:any[])=>{
    for (const r of records) {
      const codeRaw = r.indNomencl || r.code || r.indice || r["indNomencl"];
      const titleRaw = r.nome || r.title || r["Folha"] || r["nomeFolha"];
      const ufRaw = r.uf || r.UF || r.estado;
      const code = normalizeCode(String(codeRaw || "").trim());
      if (!code) continue;
      insert.run({
        code,
        title: String(titleRaw || "").trim() || null,
        uf: ufRaw ? String(ufRaw).trim().toUpperCase() : null
      });
    }
  });
  tx(rows);
  console.log(`>> Inseridos ${rows.length} registros em ${table}`);
}

loadCsvTo("sheets250k", path.join(dataDir, "carta250mil.csv"));
loadCsvTo("sheets100k", path.join(dataDir, "cartacemmil.csv"));

console.log(">> Seed concluído. DB em", dbFile);
db.close();
