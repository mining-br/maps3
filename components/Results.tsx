import { SheetCard } from "./SheetCard";
import type { SearchResponse } from "@/lib/types";

function Section({ title, items }: { title:string; items: any[] }){
  if (!items?.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((it, idx)=> <SheetCard key={idx} item={it} />)}
      </div>
    </section>
  );
}

export function Results({ data }: { data: SearchResponse }){
  return (
    <div className="space-y-8">
      <div className="card">
        <p className="text-sm text-gray-600">Resultados para <strong>{data.city}/{data.uf}</strong>. {data.sheets?.length ?? 0} folha(s) candidata(s).</p>
      </div>
      <Section title="Escala 1:250.000" items={data.groups?.k250}/>
      <Section title="Escala 1:100.000" items={data.groups?.k100}/>
      <Section title="Escala 1:50.000" items={data.groups?.k50}/>
      <Section title="Outros / Temáticos" items={data.groups?.other}/>
    </div>
  );
}
