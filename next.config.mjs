/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
    // Inclui a pasta data/ em TODAS as rotas de API
    outputFileTracingIncludes: {
      "/api/**": ["data/**"],
    },
  },
};

export default nextConfig;
