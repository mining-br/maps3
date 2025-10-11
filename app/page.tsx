"use client";

import React, { useCallback, useMemo, useState } from "react";

type ApiResp = {
  ok?: boolean;
  mode?: string;
  query?: { uf: string; city: string };
  groups?: {
    k250?: any[];
    k100?: any[];
    k50?: any[];
  };
  items?: { title: string; href: string }[];
  message?: string;
  error?: string;
  debug?: any;
};

const UF_LIST = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"
];

// simples: decodifica entidades HTML como &#x20;, &amp;, &nbsp;, etc.
function decodeHtml(s: string): string {
  if (!s) return "";
  const el = document.createElement("textarea");
  el.innerHTML = s;
  return el.value;
}

export default function HomePage() {
  const [uf, setUf] = useState<string>("BA");
  const [city, setCity] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<ApiResp | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setResp(null);
    const u = uf.trim().toUpperCase();
    const c = city.trim();
    if (!u || !c) {
      setErr("Informe UF e Cidade.");
      return;
    }
    setLoading(true);
    try {
      const qs = new URLSearchParams({ uf: u, city: c }).toString();
      const r = await fetch(`/api/search?${qs}`, { cache: "no-store" });
      const j: ApiResp = await r.json();
      setResp(j);
      if (!j.ok) {
        setErr(j.message || "Busca sem sucesso.");
      }
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, [uf, city]);

  const groups = useMemo(() => ({
    k250: resp?.groups?.k250 ?? [],
    k100: resp?.groups?.k100 ?? [],
    k50:  resp?.groups?.k50  ?? [],
  }), [resp]);

  const hasAnyGroup =
    (groups.k250?.length ?? 0) > 0 ||
    (groups.k100?.length ?? 0) > 0 ||
    (groups.k50?.length ?? 0)  > 0;

  return (
    <main style={{ maxWidth: 960, margin: "32px auto", padding: "0 16px", fontFamily: "system-ui, -apple-system, Arial, sans-serif" }}>
      <h1 style={{ marginBottom: 8 }}>Buscador SGB (RIGeo) por Cidade/UF</h1>
      <p style={{ color: "#444", marginTop: 0 }}>
        Busca ao vivo no acervo do <strong>SGB</strong> (RIGeo). Informe a UF e a cidade.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 16 }}>
        <label>
          <div style={{ fontSize: 12, color: "#555" }}>UF</div>
          <select value={uf} onChange={(e) => setUf(e.target.value)} style={{ padding: 8 }}>
            {UF_LIST.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>

        <label style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "#555" }}>Cidade</div>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex.: Salvador"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <button type="submit" disabled={loading} style={{ padding: "10px 16px" }}>
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {err && (
        <div style={{ marginTop: 16, color: "#b00020" }}>
          {err}
        </div>
      )}

      {resp?.ok && (
        <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
          {resp.mode === "live-rigeo" ? "Modo: busca ao vivo no RIGeo" : null}
        </div>
      )}

      {resp?.ok && hasAnyGroup && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 8 }}>Resultados por escala</h3>
          <GroupBlock title="1:250.000" items={groups.k250} />
          <GroupBlock title="1:100.000" items={groups.k100} />
          <GroupBlock title="1:50.000"  items={groups.k50} />
        </div>
      )}

      {resp?.ok && (resp.items?.length ?? 0) > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 8 }}>Resultados do acervo (RIGeo)</h3>
          <ul style={{ paddingLeft: 18 }}>
            {resp.items!.map((it, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                <a href={it.href} target="_blank" rel="noreferrer">
                  {decodeHtml(it.title)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {resp?.ok && !hasAnyGroup && (!resp.items || resp.items.length === 0) && (
        <div style={{ marginTop: 16 }}>
          Nenhum resultado encontrado para <strong>{resp?.query?.city}</strong> / <strong>{resp?.query?.uf}</strong>.
          Tente variações do nome (sem acentos) ou uma cidade próxima.
        </div>
      )}
    </main>
  );
}

function GroupBlock({ title, items }: { title: string; items: any[] }) {
  if (!items || items.length === 0) {
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 600 }}>{title}</div>
        <div style={{ color: "#666" }}>Sem itens para esta escala.</div>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <ul style={{ paddingLeft: 18 }}>
        {items.map((it: any, idx: number) => {
          const label = decodeHtml(
            it?.title || it?.sheetCode || it?.code || it?.name || `Folha ${idx + 1}`
          );
          const href =
            it?.href || it?.handle || it?.pdf || it?.acervo || it?.link || "#";
          return (
            <li key={idx} style={{ marginBottom: 6 }}>
              {href && href !== "#" ? (
                <a href={href} target="_blank" rel="noreferrer">
                  {label}
                </a>
              ) : (
                <span>{label}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
