export function normalizeCode(code: string): string {
  if (!code) return code;
  let c = code.trim().toUpperCase().replace(/\s+/g, "");
  c = c.replace(/\./g, "-");
  c = c.replace(/--+/g, "-");
  return c;
}

/** Remove acentos/diacríticos e mantém apenas ASCII básico */
export function strip(input: string): string {
  return (input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // remove diacríticos
    .replace(/[^\x20-\x7E]/g, "");     // remove não-ASCII (opcional)
}

export function buildFallbackSearch(city:string, uf:string, code?:string){
  const q = encodeURIComponent([city, uf, code || ""].filter(Boolean).join(" "));
  return `https://rigeo.sgb.gov.br/simple-search?query=${q}`;
}
