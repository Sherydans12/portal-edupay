import type { NextConfig } from "next";

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

const nextConfig: NextConfig = {
  output: "standalone",
  // Keep the public DSN available to a future Sentry client only when configured.
  ...(sentryDsn
    ? { env: { NEXT_PUBLIC_SENTRY_DSN: sentryDsn } }
    : {}),
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
