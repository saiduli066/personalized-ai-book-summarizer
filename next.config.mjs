/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server external packages
  serverExternalPackages: ["pdf-parse", "@xenova/transformers"],
  // Also keep in experimental for Next.js 15 compatibility
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "@xenova/transformers"],
  },
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jbrcfxysbehtsaowqevx.supabase.co",
      },
    ],
  },
};

export default nextConfig;
