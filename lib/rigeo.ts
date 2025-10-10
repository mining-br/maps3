// lib/rigeo.ts
// Busca "ao vivo" no RIGeo (DSpace) por cidade + UF.
// Não depende da base local, então funciona mesmo com cities.json apenas com "GERAL".

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

// Extrai pares {href, title} da página HTML do DSpace
function extractItems(html: string) {
  const out: { title: string; href: string }[] = [];
  const seen = new Set<string>();

  // pega anchors para /handle/... na lista de resultados
  const re = /<a[^>]+href="(\/handle\/[^"]+)"[^>]*>(.*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < 60) {
    const href = "https://rigeo.sgb.gov.br" + m[1];
    const title = stripHtml(m[2]);
    if (title.length > 5 && !seen.has(href)) {
      out.push({ title, href });
      seen.add(href);
    }
  }

  return out;
}

async function fetchRigeoPage(url: string) {
  const res = await fetch(url, {
    // ajuda a receber o HTML completo do DSpace
    headers: { "user-agent": "Mozilla/5.0 (compatible; SGB-Buscador/1.0)" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ao buscar ${url}`);
  }
  return res.text();
}

export async function searchCitySheets(uf: string, city: string) {
  // 1) consulta ampla por "Cidade UF"
  const q1 = encodeURIComponent(`${city} ${uf}`);
  const url1 = `https://rigeo.sgb.gov.br/simple-search?query=${q1}&sort_by=score&order=desc&rpp=100&etal=0&start=0`;
  const html1 = await fetchRigeoPage(url1);
  let items = extractItems(html1);

  // 2) se vier muito pouco, tenta outra query só com cidade
  if (items.length < 5) {
    const q2 = encodeURIComponent(city);
    const url2 = `https://rigeo.sgb.gov.br/simple-search?query=${q2}&sort_by=score&order=desc&rpp=100&etal=0&start=0`;
    const html2 = await fetchRigeoPage(url2);
    const extra = extractItems(html2);
    // mescla sem duplicar
    const map = new Map(items.map((i) => [i.href, i]));
    for (const e of extra) if (!map.has(e.href)) map.set(e.href, e);
    items = Array.from(map.values());
  }

  // 3) organiza uma saída compatível com o front (mantém groups vazios)
  return {
    ok: true,
    mode: "live-rigeo",
    query: { uf, city },
    groups: {
      k250: [] as any[],
      k100: [] as any[],
      k50: [] as any[],
    },
    items, // lista plana de resultados (título + link)
    debug: {
      total: items.length,
      tip: "Os grupos por escala ficam vazios porque esta busca não depende do dataset local. Você já tem links reais do RIGeo em 'items'.",
    },
  };
}

