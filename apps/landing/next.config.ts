import mdx from '@next/mdx';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withMDX = mdx();
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  transpilePackages: ['@workspace/ui', '@workspace/db', '@workspace/lib'],
  // Configure `pageExtensions` to include MDX files
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  // Optionally, add any other Next.js config below
  rewrites: async () => {
    return [
      {
        source: '/blog',
        destination: 'https://blog.lovarank.com',
      },
      {
        source: '/blog/:path*',
        destination: 'https://blog.lovarank.com/:path*',
      },
    ];
  },
};

export default withNextIntl(withMDX(nextConfig));
