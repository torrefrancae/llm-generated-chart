import type { NextConfig } from 'next';

const BASE = '/sample/ai-generate-app';
const exporting = process.env.CHART_EXPORT === '1';

const nextConfig: NextConfig = {
  output: exporting ? 'export' : undefined,
  basePath: BASE,
  assetPrefix: BASE,
  trailingSlash: true,
  images: { unoptimized: true },
  async rewrites() {
    if (exporting) return [];
    return [
      {
        source: '/api/chart/:path*',
        destination: 'http://127.0.0.1:3093/:path*',
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
