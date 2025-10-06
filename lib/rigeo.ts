// lib/rigeo.ts
import * as cheerio from "cheerio";
import type { SheetCandidate, RigeoItem, SearchResponse } from "./types";

const BASE = "https://rigeo.sgb.gov.br";
const USE_MOCK = process.env.USE_RIGEO_MOCK === "1";
const MOCK_DELAY = Number(process.env.MOCK_DELAY_MS || 0);

/** Normaliza texto para comparação (remove acentos e deixa maiúsculo) */
function norm(s?: string) {
  return (s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();
}

/** Gera variações do código da folha para buscas */
function codeVariations(code?: string) {
  if (!code) return [];
  const c = code.toUpperCase();
  return [
    c,                       // SE-23-Y-A
    c.replace(/-/g, "."),    // SE.23.Y.A
    c.replace(/-/g, " "),    // SE 23 Y A
  ];
}

/** Converte links relativos do RIGeo em absolutos */
function toAbs(href?: string, pageUrl?: string) {
  if (!href) return "";
  try {
    if (/^https?:\/\//i.test(href)) return href;
    return new URL(href, pageUrl || BASE).toString();
  } catch {
    return href ?? "";
  }
}

async function delay(ms:number){ return new Promise(r => setTimeout(r, ms)); }

async function fetchHtml(url: string){
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; sgb-mapas-app/1.0)" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar ${url}`);
  return await res.text();
}

/** Busca no RIGeo e retorna uma lista de URLs de /handle/doc/xxx priorizando quem contém o código da folha. */
async function searchHandlesByCode(city: string, uf: string, code?: string): Promise<string[]> {
  const qBase = [code, city, uf, "carta geológica mapa geológico geologia SIG relatório recursos"].filter(Boolean).join(" ");
  const urls = [
    `${BASE}/simple-search?query=${encodeURIComponent(qBase)}`,
    `${BASE}/discover?query=${encodeURIComponent(qBase)}`
  ];

  const best: string[] = [];
  const seen = new Set<string>();
  const cands = codeVariations(code);

  for (const url of urls) {
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);
      $('a[href*="/handle/doc/"]').each((_, a) => {
        const href = ($(a).attr("href") || "").trim();
        if (!href) return;
        const abs = toAbs(href, BASE);
        const text = norm($(a).text());
        const box  = norm($(a).closest("tr, li, div").text());
        const hasCode = cands.some(v => text.includes(v) || box.includes(v));
        if (!seen.has(abs)) {
          if (hasCode) {
            best.push(abs);
            seen.add(abs);
          } else if (best.length < 3) {
            best.push(abs);
            seen.add(abs);
          }
        }
      });
    } catch { /* ignora erros de página */ }
    if (best.length >= 6) break;
  }
  return best.slice(0, 6);
}

/** Lê a página /handle/doc/... e extrai links diretos (PDF/ZIP) e metadados. */
async function parseHandle(handleUrl: string, code?: string): Promise<RigeoItem> {
  const html = await fetchHtml(handleUrl);
  const $ = cheerio.load(html);

  const title = ($("h2").first().text() || $("title").text() || "Documento RIGeo").trim();
  const metaText = $(".item-summary-view, .simple-item-view, body").text();
  const year = $('meta[name="citation_publication_date"]').attr("content")
            || (metaText.match(/\b(19|20)\d{2}\b/)?.[0] ?? "");

  // escala provável (ex.: 1:250000)
  const scaleMatch = metaText.match(/1[: ]?(\d{1,3}(\.\d{3}){1,2}|\d{6})/i)?.[0]?.replace(/\s+/g,"");

  const links: Record<string,string> = {};

  // pega QUALQUER bitstream, relativo ou absoluto → vira absoluto
  $('a[href*="/bitstream/"]').each((_, el) => {
    const href = ($(el).attr("href") || "").trim();
    if (!href) return;
    const abs = toAbs(href, handleUrl);
    const name = ($(el).text() || $(el).attr("title") || abs).toLowerCase();

    const isPdf = /\.pdf(\?|$)/i.test(abs);
    const isZip = /\.(zip|7z)(\?|$)/i.test(abs);

    if (isPdf) {
      if (name.includes("geolog") || name.includes("mapa")) links.geologia ??= abs;
      else if (name.includes("recurso") || name.includes("minera")) links.recursos ??= abs;
      else if (name.includes("relat") || name.includes("texto") || name.includes("memorial")) links.relatorio ??= abs;
      else links.geologia ??= abs; // se só há um PDF claro
    }
    if (isZip || name.includes("sig") || name.includes("shape") || name.includes("shp") || name.includes("geodatabase") || name.includes("gdb")) {
      links.sig ??= abs;
    }
  });

  // link da página do acervo (sempre absoluto)
  links.acervo = toAbs(handleUrl, BASE);

  return {
    code,
    title,
    year,
    scale: scaleMatch,
    kind: "Documento",
    links,
  };
}

/** Resultados fictícios para**

