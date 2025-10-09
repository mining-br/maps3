import { NextRequest, NextResponse } from "next/server";
import { searchRIGeoByCityUF } from "@/lib/rigeo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // usar Node runtime

export async function GET(req: NextRequest) {
  const uf = (req.nextUrl.searchParams.get("uf") || "").trim().toUpperCase();
  const city = (req.nextUrl.searchParams.get("city") || "").trim();

  if (!uf || !city) {
    return NextResponse.json({ ok: false, error: "Informe 'uf' e 'city'." }, { status: 400 });
  }

  try {
    const results = await searchRIGeoByCityUF(city, uf);

    const groups = {
      k250: results.filter((r) => r.scale === "250k"),
      k100: results.filter((r) => r.scale === "100k"),
      k50: results.filter((r) => r.scale === "50k"),
      other: results.filter((r) => r.scale === "unknown")
    };

    const note =
      results.length === 0
        ? "Nenhum item encontrado diretamente. Tente variações do nome (sem acentos) ou cidades vizinhas."
        : undefined;

    return NextResponse.json({ ok: true, groups, note });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Erro inesperado." },
      { status: 500 }
    );
  }
}
