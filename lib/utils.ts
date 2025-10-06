export function normalizeCode(code: string): string {
  if (!code) return code;
  let c = code.trim().toUpperCase().replace(/\s+/g, "");
  c = c.replace(/\./g, "-");
  c = c.replace(/--+/g, "-");
  return c;
}

export function buildFallbackSearch(city:string, uf:string, code?:string){
  const q = encodeURIComponent([city, uf, code || ""].filter(Boolean).join(" "));
  return `https://rigeo.sgb.gov.br/simple-search?query=${q}`;
}
