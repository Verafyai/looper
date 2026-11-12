import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Sample-mode pages read fixtures/ at runtime; ship them with the server functions.
  outputFileTracingIncludes: {
    "/**": ["./fixtures/**/*"],
  },
};

export default nextConfig;
