/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
    // Inclui arquivos da pasta data/ nas funções (necessário pra Vercel achar vercel_data.json)
    outputFileTracingIncludes: {
      "/api/**": ["data/**"],
    },
  },
};

export default nextConfig;
