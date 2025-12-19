import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import 'sweetalert2/dist/sweetalert2.min.css'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Havia Admin - NorthernBox',
  description: 'Admin panel for NorthernBox Havia App',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

