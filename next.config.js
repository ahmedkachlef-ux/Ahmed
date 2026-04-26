/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "cdn.jsdelivr.net" }
    ]
  },
  experimental: {
    serverActions: { bodySizeLimit: "5mb" }
  }
};
module.exports = nextConfig;
