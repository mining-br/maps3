"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import Results from "@/components/Results";

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

export default function HomePage() {
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
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
      setLoading(false);
    } catch (e: any) {
      setError(String(e.message || e));
      setLoading(false);
    }
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
              className="border rounded-xl p-4 shadow-sm bg-white/70 backdrop-blur-sm"
            >
              <div className="text-sm font-semibold mb-1">
                {x.code || "Sem código"}
              </div>
              {x.title && (
                <div className="text-sm text-muted-foreground mb-1">
                  {x.title}
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

  const groups =
    result?.ok && result?.groups
      ? result.groups
      : { k250: [], k100: [], k50: [], other: [] };

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-center">
        Atlas Geológico — SGB/CPRM
      </h1>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
        <input
          type="text"
          placeholder="Cidade (ex: Cerro Corá)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="border rounded-lg px-3 py-2 w-64"
        />
        <select
          value={uf}
          onChange={(e) => setUf(e.target.value)}
          className="border rounded-lg px-3 py-2 w-24"
        >
          <option value="">UF</option>
          {[
            "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
            "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
          ].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={handleSearch}
          disabled={loading || !city || !uf}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" /> Buscando...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" /> Buscar
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="text-red-600 mt-4 text-center">
          ❌ Erro: {error}
        </div>
      )}

{!loading && result?.ok && (
  <Results city={result.city} uf={result.uf} groups={result.groups} />
          {groups.k250.length === 0 &&
          groups.k100.length === 0 &&
          groups.k50.length === 0 &&
          groups.other.length === 0 ? (
            <div className="text-center text-gray-600">
              Nenhum resultado encontrado para <b>{city}</b> / <b>{uf}</b>.<br />
              Tente uma cidade próxima ou outra UF.
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-2 text-center">
                Resultados para {result.city} / {result.uf}
              </h2>
              {renderGroup("1:250.000", groups.k250)}
              {renderGroup("1:100.000", groups.k100)}
              {renderGroup("1:50.000", groups.k50)}
            </>
          )}
        </div>
      )}
    </main>
  );
}
