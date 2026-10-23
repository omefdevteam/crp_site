import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Trail is served from public/ at a fixed URL (lib/fonts.ts) so it can be
  // preloaded; cache it like next/font's hashed files. Rename the file if the
  // font ever changes.
  async headers() {
    return [
      {
        source: "/TrailFree-p7ARD.otf",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "@react-three/drei"],
  },
};

export default nextConfig;
