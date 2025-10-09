export function normStr(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function detectScaleFromText(t: string): "250k" | "100k" | "50k" | "unknown" {
  const x = t.toLowerCase().replace(/\./g, "").replace(/\s+/g, "");
  if (/(1:)?250000|1\/250000|250k/.test(x)) return "250k";
  if (/(1:)?100000|1\/100000|100k/.test(x)) return "100k";
  if (/(1:)?50000|1\/50000|50k/.test(x)) return "50k";
  return "unknown";
}

export function uniqueBy<T>(arr: T[], key: (x: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of arr) {
    const k = key(it);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(it);
    }
  }
  return out;
}
