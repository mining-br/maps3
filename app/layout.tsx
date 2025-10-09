export const metadata = {
  title: "Buscador SGB por Cidade",
  description: "Busca ao vivo no RIGeo (SGB) por cidade/UF"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial" }}>
        {children}
      </body>
    </html>
  );
}
