// app/api/health/route.ts
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

export async function GET() {
  try {
    const p = path.join(process.cwd(), "data", "vercel_data.json");
    const exists = fs.existsSync(p);
    const size = exists ? fs.statSync(p).size : 0;
    // também tenta parsear pra garantir JSON válido
    let okJson = false;
    if (exists) {
      try {
        JSON.parse(fs.readFileSync(p, "utf-8"));
        okJson = true;
      } catch {}
    }
    return new Response(JSON.stringify({ ok: true, data_json_exists: exists, size, okJson }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
}
