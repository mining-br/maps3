// app/api/debug-db/route.ts
import { getDB } from "@/lib/db";
export const runtime = "nodejs";

export async function GET() {
  const { cities } = getDB();
  return Response.json({ count: cities.length, sample: cities.slice(0, 5) });
}
