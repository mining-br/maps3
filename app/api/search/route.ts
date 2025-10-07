// app/api/search/route.ts
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Links = { geologia?: string; recursos?: string; relatorio?: string; sig?: string; acervo?: string };
type SheetEntry = { code: string; title?: string; year?: string; links: Links };
type CityEntry = { "250k": SheetEntry[]; "100k": SheetEntry[]; "50k": SheetEntry[] };
type DataJSON = Record<string, Record<string, CityEntry>>;

function norm(s: string) {
  return (s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase().trim();
}

function loadJSON(): DataJSON {
  const p = path.join(process.cwd(), "data", "vercel_data.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Arquivo não encontrado: ${p}. Suba /data/vercel_data.json no repositório.`);
  }
  const raw = fs.readFileSync(p, "utf-8");
  return JSON.parse(raw);
}

function findCity(stateBlock: Record<string, CityEntry>, cityIn: string) {
  const keys = Object.keys(stateBlock);
  if (keys.length === 0) return { key: null as string | null, tried: [] as string[] };

  // 1) exato
  let k = keys.find((k) => k === cityIn);
  if (k) return { key: k, tried: ["exact"] };

  // 2) exato sem acento/caixa
  const target = norm(cityIn);
  k = keys.find((kk) => norm(kk) === target);
  if (k) return { key: k, tried: ["norm-exact"] };

  // 3) começa com (sem acento)
  k = keys.find((kk) => norm(kk).startsWith(target));
  if (k) return { key: k, tried: ["norm-startsWith"] };

  // 4) contém (sem acento)
  k = keys.find((kk) => norm(kk).includes(target));
  if (k) return { key: k, tried: ["norm-includes"] };

  return { key: null, tried: ["none"] };
}

function resultFromCityEntry(ce: CityEntry | undefined) {
  const toOut = (arr?: SheetEntry[]) =>
    (arr || []).map((x) => ({
      code: x.code,
      title: x.title || "",
      year: x.year || "",
      links: x.links || {},
    }));

  return {
    k250: toOut(ce?.["250k"]),
    k100: toOut(ce?.["100k"]),
    k50: toOut(ce?.["50k"]),
    other: [] as any[],
  };
}

async function handle(cityRaw: string, ufRaw: string) {
  const city = String(cityRaw || "").trim();
  const uf = String(ufRaw || "").trim().toUpperCase();

  if (!city || !uf) {
    return new Response(
      JSON.stringify({ ok: false, error: "Informe city e uf." }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  const data = loadJSON();
  const stateBlock = data[uf];

  if (!stateBlock) {
    // diagnostico: listar UFs disponíveis
    const ufs = Object.keys(data).sort();
    return new Response(
      JSON.stringify({
        ok: true,
        city,
        uf,
        groups: { k250: [], k100: [], k50: [], other: [] },
        note: "UF não encontrada no vercel_data.json",
        availableUFs: ufs,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  const { key, tried } = findCity(stateBlock, city);

  if (!key) {
    // diagnóstico: 10 amostras de cidades daquela UF para você conferir a grafia
    const samples = Object.keys(stateBlock).slice(0, 10);
    return new Response(
      JSON.stringify({
        ok: true,
        city,
        uf,
        groups: { k250: [], k100: [], k50: [], other: [] },
        note: "Cidade não encontrada no vercel_data.json",
        tried,
        samples,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  const ce = stateBlock[key];
  const groups = resultFromCityEntry(ce);
  return new Response(JSON.stringify({ ok: true, city: key, uf, groups }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const city = url.searchParams.get("city") || "";
  const uf = url.searchParams.get("uf") || "";
  return handle(city, uf);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  return handle(body?.city ?? "", body?.uf ?? "");
}
