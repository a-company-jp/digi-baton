import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    newDevOverlay: true
  },
  images: {
    remotePatterns: [
      {
        hostname: "digibatonmainstorageacct.blob.core.windows.net",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;
