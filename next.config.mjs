/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
    // inclui a pasta data/ na função /api/search
    outputFileTracingIncludes: {
      "/api/search": ["data/**"],
    },
  },
};
export default nextConfig;
