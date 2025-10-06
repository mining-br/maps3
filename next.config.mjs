/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
    // inclua a pasta data/ nas funções de API
    outputFileTracingIncludes: {
      "/api/**": ["data/**"],
    },
  },
};
export default nextConfig;
