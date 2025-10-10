// lib/rigeo.ts
// Orquestra a busca: recebe UF + cidade e devolve os grupos de folhas
// usando os helpers expostos por lib/db.

import type { CitySheets } from './db'
import { findCityExact, suggestCities } from './db'

export type SearchOk = {
  found: true
  uf: string
  city: string
  groups: CitySheets
  suggestions: string[]
}

export type SearchNotOk = {
  found: false
  uf: string
  city: string
  groups: CitySheets
  suggestions: string[]
}

export type SearchResult = SearchOk | SearchNotOk

export async function searchCitySheets(uf: string, city: string): Promise<SearchResult> {
  const hit = findCityExact(uf, city)

  if (hit) {
    // hit já é um CitySheets
    return {
      found: true,
      uf,
      city,
      groups: hit,
      suggestions: [],
    }
  }

  const sugg = suggestCities(uf, city)
  // quando não encontra, devolvemos grupos vazios para manter o shape estável
  const empty: CitySheets = { '250k': [], '100k': [], '50k': [] }

  return {
    found: false,
    uf,
    city,
    groups: empty,
    suggestions: sugg,
  }
}
