"use client";

import { useState } from "react";
import { SearchForm } from "@/components/SearchForm";
import { Results } from "@/components/Results";
import type { SearchResponse } from "@/lib/types";

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchResponse | null>(null);

  async function onSearch(city: string, uf: string) {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ city, uf })
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e:any) {
      setError(e.message || "Falha na busca");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-8">
      <SearchForm onSearch={onSearch} />
      {loading && <div className="card">Carregando resultados…</div>}
      {error && <div className="card text-red-600">Erro: {error}</div>}
      {data && <Results data={data} />}
    </main>
  );
}
