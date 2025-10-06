import * as cheerio from "cheerio";
import { buildFallbackSearch } from "./utils";
import type { SheetCandidate, RigeoItem, SearchResponse } from "./types";

const USE_MOCK = process.env.USE_RIGEO_MOCK === "1";
const MOCK_DELAY = Number(process.env.MOCK_DELAY_MS || 0);

async function delay(ms:number){ return new Promise(r => setTimeout(r, ms)); }

async function fetchHtml(url: string){
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; sgb-mapas-app/0.1)" }});
  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar ${url}`);
  return await res.text();
}

function parseRigeoItemFromHandlePage(html: string, code?: string): RigeoItem[] {
  const $ = cheerio.load(html);
  const title = ($("h2").first().text() || $("title").text() || "Documento RIGeo").trim();
  const year = $('meta[name="citation_publication_date"]').attr("content") || "";
  const links: any = {};
  $("a").each((_, el)=>{
    const href = $(el).attr("href") || "";
    const text = ($(el).text() || "").toLowerCase();
    if (/\.pdf$/i.test(href)) {
      if (text.includes("geolog")) links.geologia = href;
      else if (text.includes("recurso") || text.includes("mineral")) links.recursos = href;
      else if (text.includes("relat")) links.relatorio = href;
      else links.geologia ??= href;
    }
    if (/\.(zip|7z)$/i.test(href) || text.includes("sig")) {
      links.sig = href;
    }
    if (href.includes("/handle/")) {
      links.acervo = href;
    }
  });
  return [{
    code,
    title,
    year,
    kind: "Documento",
    links,
  }];
}

async function tryRigeoQueries(city:string, uf:string, code?:string): Promise<RigeoItem[]> {
  const q = encodeURIComponent([code, city, uf, "geologia recursos relatório SIG"].filter(Boolean).join(" "));
  const simple = `https://rigeo.sgb.gov.br/simple-search?query=${q}`;
  const discover = `https://rigeo.sgb.gov.br/discover?query=${q}`;
  const items: RigeoItem[] = [];

  try {
    const html = await fetchHtml(simple);
    const $ = cheerio.load(html);
    const firstHandle = $('a[href*="/handle/doc/"]').first().attr("href");
    if (firstHandle) {
      const page = firstHandle.startsWith("http") ? firstHandle : `https://rigeo.sgb.gov.br${firstHandle}`;
      const h = await fetchHtml(page);
      items.push(...parseRigeoItemFromHandlePage(h, code));
    } else {
      items.push({
        code,
        title: `Busca RIGeo para ${code || city}`,
        kind: "Documento",
        links: { acervo: simple },
        fallbackSearch: buildFallbackSearch(city, uf, code)
      });
    }
  } catch {
    items.push({
      code,
      title: `Busca RIGeo (fallback) para ${code || city}`,
      kind: "Documento",
      links: { acervo: simple },
      fallbackSearch: buildFallbackSearch(city, uf, code)
    });
  }

  items.forEach(it => {
    if (!it.links) it.links = {};
    (it.links as any).acervo ??= discover;
  });

  return items;
}

async function mockResults(city:string, uf:string, sheets: SheetCandidate[]): Promise<SearchResponse> {
  if (MOCK_DELAY) await delay(MOCK_DELAY);
  const groups = { k250: [] as RigeoItem[], k100: [] as RigeoItem[], k50: [] as RigeoItem[], other: [] as RigeoItem[] };
  for (const s of sheets) {
    const item: RigeoItem = {
      code: s.code,
      title: s.title || `Folha ${s.code}`,
      uf: s.uf || uf,
      scale: s.scale,
      kind: "Documento",
      links: { acervo: buildFallbackSearch(city, uf, s.code) }
    };
    if (s.scale === "1:250000") groups.k250.push(item);
    else if (s.scale === "1:100000") groups.k100.push(item);
    else if (s.scale === "1:50000") groups.k50.push(item);
    else groups.other.push(item);
  }
  return { city, uf, sheets, groups };
}

export async function searchRigeoForSheets(city: string, uf: string, sheets: SheetCandidate[]): Promise<SearchResponse> {
  if (USE_MOCK) {
    return mockResults(city, uf, sheets);
  }
  const groups = { k250: [] as RigeoItem[], k100: [] as RigeoItem[], k50: [] as RigeoItem[], other: [] as RigeoItem[] };
  for (const s of sheets) {
    const items = await tryRigeoQueries(city, uf, s.code);
    for (const it of items) {
      it.uf ??= s.uf;
      it.scale ??= s.scale;
      if (s.scale === "1:250000") groups.k250.push(it);
      else if (s.scale === "1:100000") groups.k100.push(it);
      else if (s.scale === "1:50000") groups.k50.push(it);
      else groups.other.push(it);
    }
  }
  return { city, uf, sheets, groups };
}
