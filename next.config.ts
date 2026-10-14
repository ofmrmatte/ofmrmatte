import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd()
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**"
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/ofmrmatte/**"
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/u/**"
      }
    ]
  }
};

export default nextConfig;
