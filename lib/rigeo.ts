// lib/rigeo.ts
import { CitySheets } from "./types";
import { findCityExact, suggestCities } from "./db";

export async function searchCitySheets(
  uf: string,
  city: string
): Promise<{
  found: boolean;
  uf: string;
  city: string;
  groups: CitySheets;
  suggestions: string[];
}> {
  const hit = await findCityExact(uf, city);

  if (hit) {
    const groups = hit.sheets;
    return {
      found: true,
      uf,
      city: hit.name,
      groups,
      suggestions: [],
    };
  }

  const suggestions = await suggestCities(uf, city);
  const empty: CitySheets = { "250k": [], "100k": [], "50k": [] };

  return {
    found: false,
    uf,
    city,
    groups: empty,
    suggestions,
  };
}
