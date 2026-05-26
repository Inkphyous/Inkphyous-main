/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
