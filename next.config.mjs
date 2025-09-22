/** @type {import('next').NextConfig} */
const nextConfig = {
  // Export estático para Next 15 (reemplaza `next export`)
  output: "export",

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true }
};

export default nextConfig;