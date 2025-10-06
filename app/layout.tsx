import "./../styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buscador SGB/CPRM por Cidade/UF",
  description: "Encontre cartas geológicas, relatórios e dados SIG do RIGeo para sua cidade.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="container py-8">
          <header className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Buscador SGB/CPRM por Cidade/UF</h1>
            <p className="text-sm text-gray-600">Fonte: SGB/CPRM — RIGeo</p>
          </header>
          {children}
          <footer className="mt-12 text-xs text-gray-500">
            <p>Este site realiza consultas públicas e organiza os links por escala/cartas. Use de forma responsável.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
