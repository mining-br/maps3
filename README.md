# Buscador SGB/CPRM por Cidade/UF

Next.js + TS para localizar **cartas geológicas**, **relatórios** e **dados SIG** do RIGeo por **Cidade/UF**.

## Instalação
```bash
pnpm i
# Coloque:
#   data/carta250mil.csv
#   data/cartacemmil.csv
pnpm seed
pnpm dev
```

## Vercel
- Node 20.x (em `engines`).
- Inclui `@types/better-sqlite3` e um fallback `types/better-sqlite3.d.ts` para o TS.
