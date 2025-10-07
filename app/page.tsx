"use client";

import { useState } from "react";
import SearchForm from "./components/SearchForm";
import Results from "./components/Results";

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

      {error && (
        <div className="text-red-600 text-center mb-4">
          ❌ Erro: {error}
        </div>
      )}

      {!loading && result?.ok && (
        <Results city={result.city} uf={result.uf} groups={result.groups} />
      )}

      {loading && (
        <div className="text-center text-gray-600 mt-6 animate-pulse">
          Carregando resultados…
        </div>
      )}
    </main>
  );
}
