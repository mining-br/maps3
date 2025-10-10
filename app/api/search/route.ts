// app/api/search/route.ts
import { NextResponse } from "next/server";
import { searchCitySheets } from "@/lib/rigeo";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const uf = (searchParams.get("uf") || "").toUpperCase().trim();
  const city = (searchParams.get("city") || "").trim();

  if (!uf || !city) {
    return NextResponse.json({ ok: false, error: "Informe 'uf' e 'city'." }, { status: 400 });
  }

  try {
    const result = await searchCitySheets(uf, city);
    if (!result.found) {
      return NextResponse.json({
        ok: true,
        note: `Cidade não encontrada em ${uf}.`,
        suggestions: result.suggestions,
      });
    }

    return NextResponse.json({
      ok: true,
      uf: result.uf,
      city: result.city,
      groups: result.groups, // { "250k": [...], "100k": [...], "50k": [...] }
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: `Falha na busca: ${err?.message || String(err)}` },
      { status: 500 }
    );
  }
}
