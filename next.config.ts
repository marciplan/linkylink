import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Route changes run as view transitions, so a Bundel's icon can fly from the dashboard into its hero.
    viewTransition: true,
  },
  // Dev only: hosts other than localhost that may load dev assets (e.g. a Tailscale name), comma-separated.
  allowedDevOrigins: process.env.NEXT_DEV_ORIGINS?.split(",").map((h) => h.trim()).filter(Boolean),
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
    "/api/og/default": ["./src/app/api/og/fonts/**"],
    "/api/og/profile/[username]": ["./src/app/api/og/fonts/**"],
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
