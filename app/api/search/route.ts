// app/api/search/route.ts
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Links = {
  geologia?: string;
  recursos?: string;
  relatorio?: string;
  sig?: string;
  acervo?: string;
};
type SheetEntry = { code: string; title?: string; year?: string; links: Links };
type CityEntry = { "250k": SheetEntry[]; "100k": SheetEntry[]; "50k": SheetEntry[] };
type DataJSON = Record<string, Record<string, CityEntry>>;

function norm(s: string) {
  return (s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();
}

function loadJSON(): DataJSON {
  const p = path.join(process.cwd(), "data", "vercel_data.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Arquivo não encontrado: ${p}. Suba /data/vercel_data.json no repositório.`);
  }
  const raw = fs.readFileSync(p, "utf-8");
  return JSON.parse(raw);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const cityRaw = body?.city ?? "";
    const ufRaw = body?.uf ?? "";

    const city = String(cityRaw).trim();
    const uf = String(ufRaw).trim().toUpperCase();

    if (!city || !uf) {
      return new Response(
        JSON.stringify({ ok: false, error: "Informe city e uf no corpo da requisição." }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const data = loadJSON();

    // UF precisa existir no JSON
    const stateBlock = data[uf];
    if (!stateBlock) {
      // 200 + vazio (evita 500)
      return new Response(
        JSON.stringify({
          ok: true,
          city,
          uf,
          groups: { k250: [], k100: [], k50: [], other: [] },
          note: "UF não encontrada no vercel_data.json",
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    // Busca city por chave exata OU por match sem acento
    const cityKeys = Object.keys(stateBlock);
    const keyExact = cityKeys.find((k) => k === city);
    let key = keyExact;
    if (!key) {
      const target = norm(city);
      key = cityKeys.find((k) => norm(k) === target);
    }
    if (!key) {
      // 200 + vazio (evita 500)
      return new Response(
        JSON.stringify({
          ok: true,
          city,
          uf,
          groups: { k250: [], k100: [], k50: [], other: [] },
          note: "Cidade não encontrada no vercel_data.json",
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    const ce: CityEntry = stateBlock[key];
    const toOut = (arr?: SheetEntry[]) =>
      (arr || []).map((x) => ({
        code: x.code,
        title: x.title || "",
        year: x.year || "",
        links: x.links || {},
      }));

    const groups = {
      k250: toOut(ce["250k"]),
      k100: toOut(ce["100k"]),
      k50: toOut(ce["50k"]),
      other: [] as any[],
    };

    return new Response(JSON.stringify({ ok: true, city: key, uf, groups }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    // nunca derruba com 500 sem mensagem clara
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
}
