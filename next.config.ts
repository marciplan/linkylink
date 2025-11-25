import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.google.com',
      },
      {
        protocol: 'https',
        hostname: 't3.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: '**.youtube.com',
      },
      {
        protocol: 'https',
        hostname: '**.vimeo.com',
      },
      {
        protocol: 'https',
        hostname: '**.soundcloud.com',
      },
      {
        protocol: 'https',
        hostname: '**.netflix.com',
      },
      {
        protocol: 'https',
        hostname: 'api.lummi.ai',
      },
      {
        protocol: 'https',
        hostname: 'images.lummi.ai',
      },
      {
        protocol: 'https',
        hostname: 'cdn.lummi.ai',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
  },
};

export default nextConfig;
