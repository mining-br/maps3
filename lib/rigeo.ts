import * as cheerio from "cheerio";
import { RIGeoItem } from "./types";
import { detectScaleFromText, normStr, uniqueBy } from "./utils";

const BASE = "https://rigeo.sgb.gov.br";

/**
 * Faz busca "ao vivo" no RIGeo por cidade+UF.
 * Estratégia:
 *  1) simple-search com `${city} ${uf}` (score desc, até 200 itens em 2 páginas).
 *  2) Para cada resultado, entra no handle e coleta:
 *     - título
 *     - links (bitstreams: PDFs/ZIPs)
 *     - ano (se conseguir extrair por regex)
 *     - escala (por regex no título/descrição)
 */
export async function searchRIGeoByCityUF(city: string, uf: string): Promise<RIGeoItem[]> {
  const q = `${city} ${uf}`;
  const pages = [0, 100]; // start offsets (0 e 100) para pegar até ~200 resultados
  const items: RIGeoItem[] = [];

  for (const start of pages) {
    const url = `${BASE}/simple-search?query=${encodeURIComponent(q)}&sort_by=score&order=desc&rpp=100&etal=0&start=${start}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const links = $('a[href*="/handle/"]')
      .toArray()
      .map((a) => $(a).attr("href"))
      .filter(Boolean) as string[];

    // Os resultados podem repetir anchors; normaliza e filtra só os handles
    const handleHrefs = Array.from(
      new Set(
        links
          .filter((h) => /^\/handle\/\d+\/\d+/.test(h))
          .map((h) => (h.startsWith("http") ? h : `${BASE}${h}`))
      )
    );

    for (const handle of handleHrefs) {
      try {
        const item = await parseHandlePage(handle, city, uf);
        if (item) items.push(item);
      } catch {
        // ignora itens que falharem
      }
    }
  }

  // deduplica por handle e faz pequeno ranking (prioriza escala conhecida)
  const dedup = uniqueBy(items, (x) => x.handle);
  dedup.sort((a, b) => scaleRank(a.scale) - scaleRank(b.scale));
  return dedup;
}

function scaleRank(s: RIGeoItem["scale"]) {
  switch (s) {
    case "50k": return 0;
    case "100k": return 1;
    case "250k": return 2;
    default: return 3;
  }
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (maps3-live/1.0)" } });
  if (!res.ok) throw new Error(`Falha ao acessar ${url}`);
  return await res.text();
}

async function parseHandlePage(handleUrl: string, city: string, uf: string): Promise<RIGeoItem | null> {
  const html = await fetchHtml(handleUrl);
  const $ = cheerio.load(html);

  // título
  const title =
    $("h2, .page-title, .item-title").first().text().trim() ||
    $('meta[name="DC.title"]').attr("content") ||
    "Documento RIGeo";

  // Coleta bitstreams (PDF/ZIPs)
  const links: { href: string; label: string }[] = [];
  $('a[href*="/bitstream/"]').each((_i, a) => {
    const href = $(a).attr("href");
    if (!href) return;
    const label = ($(a).text() || "Arquivo").trim();
    const abs = href.startsWith("http") ? href : `${BASE}${href}`;
    // preferir PDF/ZIP, mas guardar qualquer coisa
    if (/\.(pdf|zip)$/i.test(abs) || /bitstream/.test(abs)) {
      links.push({ href: abs, label });
    }
  });

  // Tenta extrair metadados básicos
  const pageText = $("body").text();
  const yearMatch = pageText.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch?.[0];

  // Detecta escala por título + texto
  const scale = detectScaleFromText(`${title} ${pageText}`);

  // Heurística de pertinência: a página precisa mencionar a cidade OU o título conter UF/cidade
  const hasCity =
    normStr(pageText).includes(normStr(city)) ||
    normStr(title).includes(normStr(city));

  const hasUF =
    new RegExp(`\\b${uf}\\b`, "i").test(title) ||
    new RegExp(`\\b${uf}\\b`, "i").test(pageText);

  // Relaxa um pouco: se escala conhecida e tiver pelo menos UF, aceita.
  if (!hasCity && !hasUF) {
    // muitas cartas não trazem subject municipal; filtra pouco, mas evita ruído
    return null;
  }

  return {
    handle: handleUrl,
    title,
    year,
    uf,
    links: compactLinks(links),
    scale
  };
}

function compactLinks(links: { href: string; label: string }[]) {
  // tenta renomear rótulos mais amigáveis
  return links.map((l) => {
    const low = l.href.toLowerCase();
    let label = l.label || "Arquivo";
    if (low.endsWith(".pdf")) {
      if (/explicativo|relatorio/.test(low)) label = "Relatório (PDF)";
      else if (/recursos|minerais/.test(low)) label = "Recursos Minerais (PDF)";
      else if (/geolog/i.test(low)) label = "Carta Geológica (PDF)";
      else label = "PDF";
    } else if (low.endsWith(".zip")) {
      if (/sig|shape|shp|geologia/.test(low)) label = "Dados SIG (ZIP)";
      else label = "ZIP";
    }
    return { href: l.href, label };
  });
}
