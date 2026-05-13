/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@baraticimo/types"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};
export default nextConfig;
