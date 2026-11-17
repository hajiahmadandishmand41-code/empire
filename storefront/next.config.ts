import type { NextConfig } from "next";

/** Hosts the image optimizer is allowed to fetch from.
 *
 * The optimizer makes server-side requests, so an open `remotePatterns` would be
 * an SSRF primitive. Media is served same-origin through the `/rails` rewrite
 * below (lib/api.ts `sameOriginMedia` rewrites backend URLs to relative paths),
 * so only that prefix is whitelisted locally. An operator who points the store
 * at a separate media CDN adds its host through STOREFRONT_IMAGE_HOSTS.
 */
const localPatterns = [{ pathname: "/rails/**" }, { pathname: "/api/**" }];
const extraImageHosts = (process.env.STOREFRONT_IMAGE_HOSTS || "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

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
  images: {
    localPatterns,
    remotePatterns: extraImageHosts.map((hostname) => ({ protocol: "https" as const, hostname })),
    // AVIF then WebP: on the connections this store has to serve, the encoding
    // saving is worth the CPU. Sizes match the real grid breakpoints so the
    // browser is never handed a 2000px image for a 25vw card.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [424, 640, 768, 1024, 1280, 1536],
    imageSizes: [96, 176, 256, 384],
    minimumCacheTTL: 3600,
  },
  turbopack: {
    root: process.cwd(),
    rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } },
  },
};

export default nextConfig;
