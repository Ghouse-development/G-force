import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/components/providers/auth-provider'
import { SyncProvider } from '@/components/providers/sync-provider'
import './globals.css'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-jp',
})

export const metadata: Metadata = {
  title: 'G-force | Gハウス業務システム',
  description: '営業・営業事務の業務効率を最大化するWebアプリケーション',
  icons: {
    icon: '/logo.jpg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} font-sans antialiased bg-gray-50`}>
        <AuthProvider>
          <SyncProvider>
            {children}
          </SyncProvider>
        </AuthProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: 'var(--font-noto-sans-jp)',
            },
          }}
        />
      </body>
    </html>
  )
}
