/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mjn/ui'],
  images: {
    formats: ['image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: '**.r2.cloudflarestorage.com' }],
  },
};

export default nextConfig;
