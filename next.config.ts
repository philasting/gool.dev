import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed `output: "export"` to enable Edge Functions & API Routes on Vercel.
  // Static pages continue to be pre-rendered (SSG) via generateStaticParams.
  // Dynamic API routes run as Edge Functions.
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
