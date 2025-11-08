/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // モバイル通信からのアクセスを許可
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

// PWA設定（本番環境のみ有効化）
// Vercelでは自動的にNODE_ENV=productionになる
try {
  if (process.env.NODE_ENV === 'production') {
    const withPWA = require('next-pwa')({
      dest: 'public',
      register: true,
      skipWaiting: true,
      disable: process.env.DISABLE_PWA === 'true',
      runtimeCaching: [
        {
          urlPattern: /^https?.*/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'offlineCache',
            expiration: {
              maxEntries: 200,
            },
          },
        },
      ],
    });
    module.exports = withPWA(nextConfig);
  } else {
    module.exports = nextConfig;
  }
} catch (error) {
  // PWA設定でエラーが出た場合は、PWAなしで続行
  console.warn('PWA設定をスキップしました:', error);
  module.exports = nextConfig;
}

