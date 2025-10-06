/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
    outputFileTracingIncludes: {
      "/api/**": ["data/**"], // inclui CSVs na função serverless
    },
  },
};
export default nextConfig;
