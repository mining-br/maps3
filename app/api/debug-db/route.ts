import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

// Force Node.js runtime (filesystem allowed)
export const runtime = "nodejs";

export async function GET() {
  const db = getDB();
  return NextResponse.json({
    counts: {
      cities: db.cities.length,
      states: db.byUF ? Object.keys(db.byUF).length : 0,
    },
    sample: db.cities.slice(0, 5),
  });
}
