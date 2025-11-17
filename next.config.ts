import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    API_URL: process.env.API_URL, 
  },
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
};

export default nextConfig;
