/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@precios/types"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};
export default nextConfig;
