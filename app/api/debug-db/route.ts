import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const db = getDB();
  const states = (db as any).byUF ? Object.keys((db as any).byUF).length : 0;

  return NextResponse.json({
    info: "Este endpoint só inspeciona a base local. Se cities=27, sua base tem apenas 'GERAL' por UF. A busca real é feita ao vivo no RIGeo pela rota /api/search.",
    counts: {
      cities: db.cities.length,
      states,
    },
    sample: db.cities.slice(0, 5),
  });
}
