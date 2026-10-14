import { execSync } from 'child_process';
import type { NextConfig } from 'next';

// One id per build (not per commit): a same-commit redeploy must still ship a
// new service worker. Vercel's deployment id is unique per deployment.
function buildId(): string {
  if (process.env.VERCEL_DEPLOYMENT_ID) {
    return process.env.VERCEL_DEPLOYMENT_ID;
  }
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return `${process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 12)}-${Date.now().toString(36)}`;
  }
  try {
    const sha = execSync('git rev-parse --short=12 HEAD').toString().trim();
    return `${sha}-${Date.now().toString(36)}`;
  } catch {
    return String(Date.now());
  }
}

// Fixed once per build and inherited by Next's worker processes, so the page
// bundles and the /sw.js route agree on the id.
process.env.NEXT_PUBLIC_BUILD_ID ||= buildId();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    // Versions the service worker (and its cache) per deploy.
    NEXT_PUBLIC_BUILD_ID: process.env.NEXT_PUBLIC_BUILD_ID,
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
