// app/api/search/route.ts
import { NextResponse } from "next/server";
import { searchCitySheets } from "../../../lib/rigeo";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const uf = (searchParams.get("uf") || "").toUpperCase();
  const city = (searchParams.get("city") || "").trim();

  if (!uf || !city) {
    return NextResponse.json(
      { ok: false, error: "Informe city e uf." },
      { status: 400 }
    );
  }

  const res = await searchCitySheets({ uf, city });
  return NextResponse.json(res);
}
