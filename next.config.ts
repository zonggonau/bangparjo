import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ['6143-202-65-231-120.ngrok-free.app'],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cf.cjdropshipping.com',
      },
      {
        protocol: 'https',
        hostname: 'cc-west-usa.oss-us-west-1.aliyuncs.com',
      },
      {
        protocol: 'https',
        hostname: '*.cjdropshipping.com',
      },
    ],
  },
};

export default nextConfig;
