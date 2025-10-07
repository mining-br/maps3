"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/** =======================
 *  Types
 *  ======================= */
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

type ApiGroups = {
  k250: Group[];
  k100: Group[];
  k50: Group[];
  other?: Group[];
};

/** =======================
 *  SearchForm (com autocomplete IBGE)
 *  ======================= */
type IbgeCity = {
  id: number;
  nome: string;
  microrregiao?: { mesorregiao?: { UF?: { sigla?: string } } };
  "regiao-imediata"?: { "regiao-intermediaria"?: { UF?: { sigla?: string } } };
};

function getUfFromIbge(c: IbgeCity): string {
  return (
    c?.microrregiao?.mesorregiao?.UF?.sigla ||
    c?.["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla ||
    ""
  );
}

function SearchForm({
  city,
  uf,
  onCityChange,
  onUfChange,
  onSubmit,
  loading,
}: {
  city: string;
  uf: string;
  onCityChange: (v: string) => void;
  onUfChange: (v: string) => void;
  onSubmit: () => void;
  loading?: boolean;
}) {
  const [q, setQ] = useState(city);
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [items, setItems] = useState<Array<{ name: string; uf: string }>>([]);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!q || q.trim().length < 2) {
      setItems([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setFetching(true);
        const url = `https://servicodados.ibge.gov.br/api/v1/localidades/municipios?nome=${encodeURIComponent(
          q.trim()
        )}`;
        const res = await fetch(url, { cache: "no-store" });
        const data: IbgeCity[] = await res.json();
        const seen = new Set<string>();
        const rows: Array<{ name: string; uf: string }> = [];
        for (const c of data) {
          const name = c?.nome || "";
          const ufSigla = (getUfFromIbge(c) || "").toUpperCase();
          if (!name || !ufSigla) continue;
          const key = `${name}|${ufSigla}`;
          if (!seen.has(key)) {
            seen.add(key);
            rows.push({ name, uf: ufSigla });
          }
        }
        const prioritized = rows.sort((a, b) => {
          if (!uf) return 0;
          const aw = a.uf === uf ? -1 : 0;
          const bw = b.uf === uf ? -1 : 0;
          return aw - bw;
        });
        setItems(prioritized.slice(0, 20));
        setOpen(true);
      } catch {
        setItems([]);
        setOpen(false);
      } finally {
        setFetching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, uf]);

  const canSearch = useMemo(() => !!q.trim() && !!uf, [q, uf]);

  function pick(name: string, ufSel: string) {
    onCityChange(name);
    onUfChange(ufSel);
    setQ(name);
    setOpen(false);
  }

  return (
    <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
      {/* Campo cidade com autocomplete */}
      <div className="relative w-full sm:w-[360px]" ref={boxRef}>
        <label className="block text-sm text-gray-600 mb-1">Cidade</label>
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              onCityChange(""); // limpa seleção até o usuário confirmar
            }}
            onFocus={() => q.trim().length >= 2 && setOpen(true)}
            placeholder="Ex.: Cerro Corá"
            className="outline-none flex-1"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                onCityChange("");
                setItems([]);
                setOpen(false);
              }}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Limpar"
              title="Limpar"
            >
              ✕
            </button>
          )}
        </div>

        {open && (items.length > 0 || fetching) && (
          <div className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-72 overflow-auto">
            {fetching && (
              <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                <span className="animate-spin">⏳</span> Carregando…
              </div>
            )}
            {!fetching &&
              items.map((it, idx) => (
                <button
                  key={`${it.name}-${it.uf}-${idx}`}
                  type="button"
                  onClick={() => pick(it.name, it.uf)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50"
                >
                  <div className="text-sm font-medium">{it.name}</div>
                  <div className="text-xs text-gray-500">UF: {it.uf}</div>
                </button>
              ))}
            {!fetching && items.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">Sem resultados…</div>
            )}
          </div>
        )}
      </div>

      {/* Campo UF */}
      <div className="w-full sm:w-[140px]">
        <label className="block text-sm text-gray-600 mb-1">UF</label>
        <select
          value={uf}
          onChange={(e) => onUfChange(e.target.value)}
          className="border rounded-lg px-3 py-2 w-full bg-white"
        >
          <option value="">Selecione</option>
          {[
            "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
            "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
          ].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Botão buscar */}
      <div className="w-full sm:w-auto">
        <label className="block opacity-0 select-none mb-1">.</label>
        <button
          onClick={onSubmit}
          disabled={!canSearch || !!loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-60"
        >
          {loading ? "Buscando…" : "Buscar"}
        </button>
      </div>
    </div>
  );
}

/** =======================
 *  Results (cards de saída)
 *  ======================= */
function Results({ city, uf, groups }: { city: string; uf: string; groups: ApiGroups }) {
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
                <div className="text-sm text-gray-600 mb-1">{x.title}</div>
              )}
              {x.year && (
                <div className="text-xs text-gray-500 mb-2">Ano: {x.year}</div>
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

/** =======================
 *  Página principal
 *  ======================= */
export default function HomePage() {
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!city || !uf) return;
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, uf }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Atlas Geológico — SGB/CPRM
      </h1>

      {/* Formulário */}
      <div className="mb-8">
        <SearchForm
          city={city}
          uf={uf}
          onCityChange={setCity}
          onUfChange={setUf}
          onSubmit={handleSearch}
          loading={loading}
        />
      </div>

      {/* Erro */}
      {error && (
        <div className="text-red-600 text-center mb-4">❌ Erro: {error}</div>
      )}

      {/* Resultados */}
      {!loading && result?.ok && (
        <Results city={result.city} uf={result.uf} groups={result.groups as ApiGroups} />
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center text-gray-600 mt-6 animate-pulse">
          Carregando resultados…
        </div>
      )}
    </main>
  );
}
