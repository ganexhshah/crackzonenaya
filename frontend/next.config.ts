import type { NextConfig } from "next";

const getConnectSrc = () => {
  const connectSrc = new Set<string>(["'self'", "https:"]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      const origin = new URL(apiUrl).origin;
      connectSrc.add(origin);
    } catch {
      // Ignore invalid API URL env values
    }
  }

  if (process.env.NODE_ENV !== "production") {
    connectSrc.add("http://localhost:5000");
    connectSrc.add("http://127.0.0.1:5000");
  }

  return Array.from(connectSrc).join(" ");
};

const nextConfig: NextConfig = {
  async headers() {
    const connectSrc = getConnectSrc();

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value:
              `default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com; connect-src ${connectSrc}; frame-src https://accounts.google.com;`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
