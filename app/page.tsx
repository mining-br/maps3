"use client";

import { useState } from "react";

const UFS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA",
  "MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN",
  "RO","RR","RS","SC","SE","SP","TO"
];

type ApiItem = {
  handle: string;
  title: string;
  year?: string;
  uf?: string;
  links: { href: string; label: string }[];
  scale: "250k" | "100k" | "50k" | "unknown";
};

type ApiResponse = {
  ok: boolean;
  error?: string;
  groups?: {
    k250: ApiItem[];
    k100: ApiItem[];
    k50: ApiItem[];
    other: ApiItem[];
  };
  note?: string;
};

export default function Page() {
  const [uf, setUf] = useState("MG");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`/api/search?uf=${encodeURIComponent(uf)}&city=${encodeURIComponent(city)}`);
      const json: ApiResponse = await res.json();
      setData(json);
    } catch (err) {
      setData({ ok: false, error: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  function Group({ title, items }: { title: string; items: ApiItem[] }) {
    return (
      <div style={{ marginTop: 24 }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3>
        {items.length === 0 ? (
          <p style={{ color: "#555" }}>Nenhum item encontrado.</p>
        ) : (
          <ul style={{ paddingLeft: 18 }}>
            {items.map((it) => (
              <li key={it.handle} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 600 }}>{it.title}</div>
                <div style={{ fontSize: 13, color: "#666" }}>
                  {it.year ? `Ano: ${it.year} · ` : ""}Handle:{" "}
                  <a href={it.handle} target="_blank" rel="noreferrer">{it.handle}</a>
                </div>
                <div style={{ marginTop: 4, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {it.links.map((l, i) => (
                    <a
                      key={i}
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        border: "1px solid #ddd",
                        padding: "4px 8px",
                        borderRadius: 6,
                        textDecoration: "none"
                      }}
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <main style={{ maxWidth: 880, margin: "32px auto", padding: "0 16px" }}>
      <h1 style={{ marginTop: 0 }}>Buscador SGB (RIGeo) por Cidade/UF</h1>
      <p style={{ color: "#444" }}>
        Busca ao vivo no acervo do <strong>SGB</strong> (RIGeo). Informe a UF e a cidade.
      </p>

      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <label>
          UF<br />
          <select value={uf} onChange={(e) => setUf(e.target.value)} required>
            {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
        <label style={{ flex: 1, minWidth: 240 }}>
          Cidade<br />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex.: Belo Horizonte"
            required
            style={{ width: "100%", padding: 8 }}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "8px 14px", cursor: "pointer" }}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {data && (
        <section style={{ marginTop: 24 }}>
          {!data.ok && <p style={{ color: "crimson" }}>Erro: {data.error}</p>}
          {data.ok && data.note && <p style={{ color: "#666" }}>{data.note}</p>}
          {data.ok && data.groups && (
            <>
              <Group title="1:250k" items={data.groups.k250} />
              <Group title="1:100k" items={data.groups.k100} />
              <Group title="1:50k" items={data.groups.k50} />
              <Group title="Outros (escala não detectada)" items={data.groups.other} />
            </>
          )}
        </section>
      )}
    </main>
  );
}
