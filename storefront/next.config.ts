import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Browser requests stay relative to the storefront origin. This destination
  // is evaluated by the Next server, never by the user's browser.
  async rewrites() {
    const backend = process.env.API_INTERNAL_URL || "http://127.0.0.1:3000";
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/rails/:path*", destination: `${backend}/rails/:path*` },
      { source: "/dashboard", destination: `${backend}/dashboard` },
      { source: "/dashboard/:path*", destination: `${backend}/dashboard/:path*` },
      { source: "/sellers", destination: `${backend}/sellers` },
      { source: "/sellers/:path*", destination: `${backend}/sellers/:path*` },
    ];
  },
  turbopack: {
    root: process.cwd(),
    rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } },
  },
};

export default nextConfig;
