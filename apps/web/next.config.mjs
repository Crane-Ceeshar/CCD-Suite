/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ccd/ui', '@ccd/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;
