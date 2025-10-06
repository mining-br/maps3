"use client";

import { useState, useEffect } from "react";

const UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"] as const;

export function SearchForm({ onSearch }:{ onSearch: (city:string, uf:string)=>void }) {
  const [uf, setUf] = useState< (typeof UFS)[number] >("SP");
  const [city, setCity] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    async function fetchCities() {
      setLoading(true);
      try {
        const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
        const json = await res.json();
        setCities(json.map((m:any)=> m.nome));
      } catch {
        setCities([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCities();
  }, [uf]);

  return (
    <section className="card space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium mb-1">UF</label>
          <select value={uf} onChange={e=>setUf(e.target.value as any)} className="select">
            {UFS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Cidade</label>
          <input className="input" list="cities" value={city} onChange={e=>setCity(e.target.value)} placeholder="Digite a cidade…" />
          <datalist id="cities">
            {cities.map(c => <option key={c} value={c} />)}
          </datalist>
          {loading && <p className="text-xs text-gray-500 mt-1">Carregando municípios do IBGE…</p>}
        </div>
      </div>
      <div>
        <button
          onClick={()=> onSearch(city.trim(), uf)}
          className="btn"
          disabled={!city.trim()}
        >
          Buscar no RIGeo
        </button>
      </div>
    </section>
  );
}
