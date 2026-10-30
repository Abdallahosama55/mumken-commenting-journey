import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  typedRoutes: true,
  poweredByHeader: false,
  // The shared package ships TypeScript source; Next compiles it like app code.
  transpilePackages: ['@commenting/core'],
};

export default nextConfig;
