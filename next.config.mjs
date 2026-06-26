/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['firebase-admin'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/legal/:path*',
        destination: '/legal',
      },
      {
        source: '/legaldata/:path*',
        destination: '/legal',
      },
    ];
  },
};

export default nextConfig;
