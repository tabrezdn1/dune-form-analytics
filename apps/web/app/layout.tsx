import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/navigation/Header';
import { RouteProgressBar } from '@/components/ui/RouteProgressBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dune Forms',
  description: 'Create dynamic forms and analyze responses in real-time',
  keywords: ['forms', 'analytics', 'surveys', 'real-time', 'dashboard'],
  authors: [{ name: 'Dune Forms Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <RouteProgressBar />
          <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
