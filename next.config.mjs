/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable server-side features
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "@xenova/transformers"],
  },
  // Disable dev indicators
  devIndicators: false,
  // Webpack config for transformers.js
  webpack: (config, { isServer }) => {
    // Handle binary files
    config.module.rules.push({
      test: /\.node$/,
      use: "node-loader",
    });

    // Prevent bundling of certain packages on server
    if (isServer) {
      config.externals.push({
        "onnxruntime-node": "onnxruntime-node",
      });
    }

    return config;
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
