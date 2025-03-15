import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  productionBrowserSourceMaps: true, // Enable source maps in production
  env: {
    NEXT_PUBLIC_DEBUG: 'true',      // Enable debug mode
  },
};

export default nextConfig;
