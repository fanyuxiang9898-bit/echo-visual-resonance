import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Echo：视觉回响',
  description: '让现实与幻象在这里重逢',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
