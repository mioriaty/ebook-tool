import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["typo-js"],
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
