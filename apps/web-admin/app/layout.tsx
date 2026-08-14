import React from 'react';
import AppShell from '../components/shell/AppShell';
import './globals.css';

export const metadata = {
  title: 'Tools FB | Editorial Operations Cockpit',
  description: 'Trung tâm Vận hành Nội dung & Tự động hóa Facebook Page Chuyên nghiệp',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className="bg-slate-50 text-slate-900 min-h-screen font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
