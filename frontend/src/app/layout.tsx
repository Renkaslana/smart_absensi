import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1e3a8a',
};

export const metadata: Metadata = {
  title: 'Smart Absensi | Sistem Absensi Berbasis Wajah',
  description: 'Sistem absensi modern menggunakan teknologi face recognition untuk kampus dan institusi pendidikan.',
  keywords: ['absensi', 'face recognition', 'attendance', 'kampus', 'mahasiswa'],
  authors: [{ name: 'Smart Absensi Team' }],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className={`${inter.className} min-h-screen bg-neutral-50`}>
        {children}
      </body>
    </html>
  );
}
