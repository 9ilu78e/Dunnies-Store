import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
      },
    ],
  },
  env: {
    API_URL: process.env.API_URL, // Example of using environment variables
  },
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  // Additional Next.js configuration options can be added here
};

export default nextConfig;