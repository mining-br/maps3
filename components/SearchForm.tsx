"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

type Props = {
  city: string;
  uf: string;
  onCityChange: (v: string) => void;
  onUfChange: (v: string) => void;
  onSubmit: () => void;
  loading?: boolean;
};

type IbgeCity = {
  id: number;
  nome: string;
  microrregiao?: {
    mesorregiao?: {
      UF?: { sigla?: string };
    };
  };
  "regiao-imediata"?: {
    "regiao-intermediaria"?: {
      UF?: { sigla?: string };
    };
  };
};

function getUfFromIbge(c: IbgeCity): string {
  // tenta várias estruturas possíveis do IBGE
  return (
    c?.microrregiao?.mesorregiao?.UF?.sigla ||
    c?.["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla ||
    ""
  );
}

export default function SearchForm({
  city,
  uf,
  onCityChange,
  onUfChange,
  onSubmit,
  loading,
}: Props) {
  const [q, setQ] = useState(city);
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [items, setItems] = useState<Array<{ name: string; uf: string }>>([]);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // fecha dropdown ao clicar fora
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // debounce de busca
  useEffect(() => {
    if (!q || q.trim().length < 2) {
      setItems([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setFetching(true);
        // Busca por nome (server IBGE permite CORS)
        const url = `https://servicodados.ibge.gov.br/api/v1/localidades/municipios?nome=${encodeURIComponent(
          q.trim()
        )}`;
        const res = await fetch(url, { cache: "no-store" });
        const data: IbgeCity[] = await res.json();
        // normaliza e deduplica por nome+UF
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
        // se usuário já selecionou UF, filtra para priorizar a UF
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
              <X size={16} />
            </button>
          )}
        </div>

        {open && (items.length > 0 || fetching) && (
          <div className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-72 overflow-auto">
            {fetching && (
              <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando…
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
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Buscando…
            </>
          ) : (
            <>
              <Search className="w-4 h-4" /> Buscar
            </>
          )}
        </button>
      </div>
    </div>
  );
}

