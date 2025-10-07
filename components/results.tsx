"use client";

import React from "react";

type Links = {
  geologia?: string;
  recursos?: string;
  relatorio?: string;
  sig?: string;
  acervo?: string;
};

type Group = {
  code: string;
  title?: string;
  year?: string;
  links: Links;
};

type Props = {
  city: string;
  uf: string;
  groups: {
    k250: Group[];
    k100: Group[];
    k50: Group[];
    other?: Group[];
  };
};

export default function Results({ city, uf, groups }: Props) {
  if (
    groups.k250.length === 0 &&
    groups.k100.length === 0 &&
    groups.k50.length === 0 &&
    (!groups.other || groups.other.length === 0)
  ) {
    return (
      <div className="text-center text-gray-600 mt-6">
        Nenhum resultado encontrado para <b>{city}</b> / <b>{uf}</b>.
        <br />
        Tente uma cidade próxima ou verifique se há folha mapeada no RIGeo.
      </div>
    );
  }

  function renderGroup(label: string, arr: Group[]) {
    if (!arr || arr.length === 0) return null;
    return (
      <div className="my-6">
        <h3 className="text-lg font-semibold mb-2">{label}</h3>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {arr.map((x, i) => (
            <div
              key={i}
              className="border rounded-xl p-4 shadow-sm bg-white/70 backdrop-blur-sm hover:shadow-md transition-all"
            >
              <div className="text-sm font-semibold mb-1">
                {x.code || "Sem código"}
              </div>
              {x.title && (
                <div className="text-sm text-muted-foreground mb-1">
                  {x.title}
                </div>
              )}
              {x.year && (
                <div className="text-xs text-gray-500 mb-2">
                  Ano: {x.year}
                </div>
              )}
              <div className="flex flex-col gap-1 mt-2">
                {x.links.geologia && (
                  <a
                    href={x.links.geologia}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    📄 Geologia
                  </a>
                )}
                {x.links.recursos && (
                  <a
                    href={x.links.recursos}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    💎 Recursos Minerais
                  </a>
                )}
                {x.links.relatorio && (
                  <a
                    href={x.links.relatorio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    📘 Relatório
                  </a>
                )}
                {x.links.sig && (
                  <a
                    href={x.links.sig}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    🗺️ Dados SIG
                  </a>
                )}
                {x.links.acervo && (
                  <a
                    href={x.links.acervo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    🌐 Página do Acervo
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-2 text-center">
        Resultados para {city} / {uf}
      </h2>

      {renderGroup("1:250.000", groups.k250)}
      {renderGroup("1:100.000", groups.k100)}
      {renderGroup("1:50.000", groups.k50)}

      {groups.other && groups.other.length > 0 && renderGroup("Outros", groups.other)}
    </div>
  );
}
