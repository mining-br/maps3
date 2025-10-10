import { NextResponse } from "next/server";
import { searchCitySheets } from "@/lib/rigeo";

// garantir filesystem/fetch estável
export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const uf = (searchParams.get("uf") || "").toUpperCase().trim();
  const city = (searchParams.get("city") || "").trim();

  if (!uf || !city) {
    return NextResponse.json({ ok: false, message: "Informe 'uf' e 'city'." });
  }

  try {
    const result = await searchCitySheets(uf, city);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      message: "Falha na busca no RIGeo.",
      error: String(err?.message || err),
    });
  }
}
