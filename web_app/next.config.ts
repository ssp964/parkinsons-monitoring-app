import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://10.0.0.118:8000/:path*',
      },
    ];
  },
};

export default nextConfig;
