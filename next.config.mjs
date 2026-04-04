/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server external packages (Next.js 15+)
  serverExternalPackages: ["pdf-parse", "@xenova/transformers"],
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