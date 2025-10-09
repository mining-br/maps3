// app/api/debug-db/route.ts
import { NextResponse } from "next/server";
import { getDB } from "../../../lib/db";

export async function GET() {
  const db = getDB();
  return NextResponse.json({
    ok: true,
    counts: {
      cities: db.cities.length,
      states: Object.keys(db.byUF).length,
    },
    sample: db.cities.slice(0, 5),
  });
}
