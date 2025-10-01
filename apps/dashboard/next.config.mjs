/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@workspace/ui', '@workspace/db', '@workspace/lib'],
  serverExternalPackages: ['@mastra/*', '@libsql/*', 'libsql'],
  outputFileTracingRoot: '../../',
  webpack: (config, { isServer }) => {
    // Exclude README.md and other non-JS files from being processed by webpack
    config.module.rules.push({
      test: /\.(md|txt)$/,
      use: 'ignore-loader',
    });

    // Handle libsql and @libsql packages properly
    if (isServer) {
      config.externals.push('@libsql/client', 'libsql');
    }

    return config;
  },
};

export default nextConfig;
