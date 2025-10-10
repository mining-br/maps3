// app/api/debug-db/route.ts
import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export async function GET() {
  const db = await getDB();

  return NextResponse.json({
    ok: true,
    counts: {
      states: Object.keys(db.byUF).length,
      cities: db.cities.length,
    },
    sample: db.cities.slice(0, 5),
  });
}
