
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // This tells Next.js that your `app` or `pages` directory,
  // and other source files like components and lib, are inside `frontend/src`.
  srcDir: 'frontend/src',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
