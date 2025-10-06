import type { RigeoItem } from "@/lib/types";

export function SheetCard({ item }: { item: RigeoItem }) {
  return (
    <div className="card space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{item.title}</h3>
          <p className="text-xs text-gray-500">
            {item.code && <>Folha <span className="font-mono">{item.code}</span> — </>} 
            {item.scale ? `Escala ${item.scale}` : "Escala não informada"} 
            {item.uf ? ` — ${item.uf}` : ""}
            {item.year ? ` — ${item.year}` : ""}
          </p>
        </div>
        <span className="badge">{item.kind ?? "Documento"}</span>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        {item.links?.geologia && <a className="btn" href={item.links.geologia} target="_blank" rel="noreferrer">PDF Geologia</a>}
        {item.links?.recursos && <a className="btn" href={item.links.recursos} target="_blank" rel="noreferrer">Recursos Minerais</a>}
        {item.links?.relatorio && <a className="btn" href={item.links.relatorio} target="_blank" rel="noreferrer">Relatório completo</a>}
        {item.links?.sig && <a className="btn" href={item.links.sig} target="_blank" rel="noreferrer">SIG (vetores)</a>}
        {item.links?.acervo && <a className="btn" href={item.links.acervo} target="_blank" rel="noreferrer">Metadados / Acervo</a>}
        {item.fallbackSearch && <a className="btn" href={item.fallbackSearch} target="_blank" rel="noreferrer">Busca geral</a>}
      </div>
    </div>
  );
}
