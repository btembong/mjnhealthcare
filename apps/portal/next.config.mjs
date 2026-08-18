/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mjn/ui'],
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
