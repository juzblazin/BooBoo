import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // SSE route streams for up to the full cast duration.
    staleTimes: { dynamic: 0 },
  },
};

export default nextConfig;
