import { execSync } from 'child_process';
import type { NextConfig } from 'next';

function buildId(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 12);
  }
  try {
    return execSync('git rev-parse --short=12 HEAD').toString().trim();
  } catch {
    return String(Date.now());
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    // Versions the service worker (and its cache) per deploy.
    NEXT_PUBLIC_BUILD_ID: process.env.NEXT_PUBLIC_BUILD_ID || buildId(),
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
