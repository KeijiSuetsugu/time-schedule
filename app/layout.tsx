import type { Metadata } from 'next';
import './globals.css';
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration';

export const metadata: Metadata = {
  title: 'タイムカードシステム',
  description: '職場で使えるタイムカードシステム',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'タイムカード',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="bg-gray-50 min-h-screen">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}

