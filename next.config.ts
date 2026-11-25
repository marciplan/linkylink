import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The OAuth consent page must never be framed, or a hidden iframe could trick a click on Allow.
  async headers() {
    return [
      {
        source: "/oauth/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        ],
      },
    ]
  },
  // Share-image fonts are read from disk at runtime; make sure deployments include them.
  outputFileTracingIncludes: {
    "/api/og/[slug]": ["./src/app/api/og/fonts/**"],
    "/api/og/story/[slug]": ["./src/app/api/og/fonts/**"],
  },
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
