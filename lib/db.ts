// lib/db.ts
// Monta um "banco" em memória a partir de data/vercel_data.json
// e expõe helpers para lookup por UF + cidade.

import vercelData from '@/data/vercel_data.json' assert { type: 'json' }

// Tipos mínimos necessários (mantém compatível com o resto do projeto)
export type SheetEntry = {
  code: string
  title?: string
  year?: string | number
  pdf?: string
  minerals?: string
  report?: string
  sig?: string
  handle?: string
}

export type CitySheets = {
  '250k': SheetEntry[]
  '100k': SheetEntry[]
  '50k': SheetEntry[]
}

export type DB = {
  // Lista simples (útil para debug)
  cities: { uf: string; city: string; title?: string }[]
  // Índice principal: UF -> Cidade -> Grupos de folhas
  byUF: Record<string, Record<string, CitySheets>>
}

function ensureCitySheets(obj: any): CitySheets {
  const empty: CitySheets = { '250k': [], '100k': [], '50k': [] }
  if (!obj || typeof obj !== 'object') return empty

  const k250 = Array.isArray((obj as any)['250k']) ? (obj as any)['250k'] : []
  const k100 = Array.isArray((obj as any)['100k']) ? (obj as any)['100k'] : []
  const k50 = Array.isArray((obj as any)['50k']) ? (obj as any)['50k'] : []

  return { '250k': k250, '100k': k100, '50k': k50 }
}

let CACHE: DB | null = null

function buildDB(): DB {
  const byUF: Record<string, Record<string, CitySheets>> = {}
  const cities: DB['cities'] = []

  // vercel_data.json esperado: { "BA": { "Salvador": {...}, "GERAL": {...} }, "SP": { ... } }
  for (const [uf, cityMap] of Object.entries<any>(vercelData as any)) {
    if (!cityMap || typeof cityMap !== 'object') continue
    byUF[uf] = {}

    for (const [city, payload] of Object.entries<any>(cityMap)) {
      byUF[uf][city] = ensureCitySheets(payload)
      cities.push({ uf, city, title: city })
    }
  }

  return { byUF, cities }
}

export function getDB(): DB {
  if (CACHE) return CACHE
  CACHE = buildDB()
  return CACHE
}

// ---------- Helpers de busca (usados pela API) ----------

const norm = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

/**
 * Busca exata (case-insensitive e sem acentos) e tenta fallback por aproximação simples.
 */
export function findCitySheets(uf: string, city: string): {
  sheets: CitySheets | null
  suggestions: string[]
} {
  const db = getDB()
  const state = db.byUF[uf]
  if (!state) return { sheets: null, suggestions: [] }

  // 1) match exato por normalização
  const nQuery = norm(city)
  for (const key of Object.keys(state)) {
    if (norm(key) === nQuery) {
      return { sheets: state[key], suggestions: [] }
    }
  }

  // 2) fallback: sugestões por "includes"
  const suggestions: string[] = []
  for (const key of Object.keys(state)) {
    if (norm(key).includes(nQuery)) {
      suggestions.push(key)
      if (suggestions.length >= 10) break
    }
  }

  return { sheets: null, suggestions }
}
