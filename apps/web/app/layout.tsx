import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dune Form Analytics',
  description: 'Create dynamic forms and analyze responses in real-time',
  keywords: ['forms', 'analytics', 'surveys', 'real-time', 'dashboard'],
  authors: [{ name: 'Dune Analytics Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
