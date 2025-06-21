
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // No srcDir needed if 'src' is at the root and contains 'app'
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
