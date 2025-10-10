// lib/db.ts
import fs from "node:fs";
import path from "node:path";
import { DB, CitySheets, UFMap } from "./types";
import { norm } from "./utils";

let _db: DB | null = null;

function ensureCitySheets(obj: any): CitySheets {
  const empty: CitySheets = { "250k": [], "100k": [], "50k": [] };
  return {
    "250k": Array.isArray(obj?.["250k"]) ? obj["250k"] : [],
    "100k": Array.isArray(obj?.["100k"]) ? obj["100k"] : [],
    "50k": Array.isArray(obj?.["50k"]) ? obj["50k"] : [],
  } ?? empty;
}

export async function getDB(): Promise<DB> {
  if (_db) return _db;

  // Caminho do vercel_data.json
  const dataFile = path.join(process.cwd(), "data", "vercel_data.json");
  if (!fs.existsSync(dataFile)) {
    throw new Error("Arquivo data/vercel_data.json não encontrado.");
  }

  const raw = fs.readFileSync(dataFile, "utf-8");
  const json = JSON.parse(raw) as any;

  // Aceita dois formatos:
  // 1) { "UF": { "Cidade": { "250k":[], "100k":[], "50k":[] }, ... }, ... }
  // 2) { "byUF": { ...o mapa acima... } }
  const byUF: UFMap = json.byUF ? json.byUF : json;

  // Normaliza estrutura e gera lista de cidades
  const cities: { uf: string; city: string }[] = [];

  for (const uf of Object.keys(byUF)) {
    const cityMap = byUF[uf] || {};
    for (const cityName of Object.keys(cityMap)) {
      // Garante que cada cidade tenha as três chaves
      (byUF[uf][cityName] as any) = ensureCitySheets(cityMap[cityName]);
      cities.push({ uf, city: cityName });
    }
  }

  _db = { byUF, cities };
  return _db;
}

// Utilitário: encontra cidade por UF e nome normalizado
export async function findCityExact(uf: string, city: string) {
  const db = await getDB();
  const ufMap = db.byUF[uf];
  if (!ufMap) return null;

  const needle = norm(city);
  for (const name of Object.keys(ufMap)) {
    if (norm(name) === needle) {
      return { name, sheets: ufMap[name] };
    }
  }
  return null;
}

// Utilitário: sugestões aproximadas dentro da UF
export async function suggestCities(uf: string, city: string, max = 10) {
  const db = await getDB();
  const ufMap = db.byUF[uf] || {};
  const needle = norm(city);

  const score = (name: string) => {
    const n = norm(name);
    if (n === needle) return 0;
    let s = 0;
    if (!n.startsWith(needle)) s += 1;
    if (!n.includes(needle)) s += 1;
    return s;
  };

  return Object.keys(ufMap)
    .map((name) => ({ name, s: score(name) }))
    .sort((a, b) => a.s - b.s)
    .slice(0, max)
    .map((x) => x.name);
}
