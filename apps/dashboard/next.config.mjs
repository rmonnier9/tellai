import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@workspace/ui', '@workspace/db', '@workspace/lib'],
  serverExternalPackages: ['@mastra/*', '@libsql/client', 'libsql'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize all libsql packages - they have native bindings
      // that cannot be bundled by webpack
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        /@libsql\/.*/,
        /libsql/,
      ];
    }

    return config;
  },
};

export default nextConfig;
