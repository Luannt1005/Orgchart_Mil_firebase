/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,        // Disable ESLint errors on Netlify build
  },
  typescript: {
    ignoreBuildErrors: true,         // Disable TS errors during build
  },
};

export default nextConfig;
