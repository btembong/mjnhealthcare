/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mjn/ui'],
  typescript: { ignoreBuildErrors: true },
  images: {
    formats: ['image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: '**.r2.cloudflarestorage.com' }],
  },
};

export default nextConfig;
