import { NextResponse } from "next/server";
import { searchCitySheets } from "@/lib/rigeo";

// Force Node.js runtime (filesystem allowed)
export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const uf = (searchParams.get("uf") || "").toUpperCase();
  const city = searchParams.get("city") || "";

  if (!uf || !city) {
    return NextResponse.json({
      ok: false,
      message: "Informe 'uf' e 'city'.",
    });
  }

  const result = await searchCitySheets(uf, city);
  return NextResponse.json(result);
}
