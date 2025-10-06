import { NextResponse } from "next/server";
import { resolveSheetsForPlace } from "@/lib/sheets";
import { searchRigeoForSheets } from "@/lib/rigeo";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { city, uf } = await req.json();
    if (!city || !uf) {
      return NextResponse.json({ error: "city e uf são obrigatórios" }, { status: 400 });
    }
    const sheets = await resolveSheetsForPlace(city, uf);
    const results = await searchRigeoForSheets(city, uf, sheets);
    return NextResponse.json(results);
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Erro inesperado" }, { status: 500 });
  }
}
