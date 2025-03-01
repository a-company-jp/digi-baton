import { type Metadata, Viewport } from 'next'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Noto_Sans_JP } from 'next/font/google'
import './globals.css'

export const viewport: Viewport = {
  maximumScale: 1,
};

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Digi Baton',
  description: 'Digi Baton',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${notoSansJP.className} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}