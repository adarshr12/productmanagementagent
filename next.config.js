/** @type {import('next').NextConfig} */
const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH !== undefined
    ? process.env.NEXT_PUBLIC_BASE_PATH
    : "/productagent";

const nextConfig = {
  reactStrictMode: true,
  basePath: basePath || undefined,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    if (!basePath) return [];
    return [
      {
        source: "/",
        destination: basePath,
        basePath: false,
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
