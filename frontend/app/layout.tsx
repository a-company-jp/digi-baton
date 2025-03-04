import { type Metadata, Viewport } from "next";
import {
  ClerkProvider,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  SignInButton,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  SignUpButton,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  SignedIn,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  SignedOut,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  UserButton,
} from "@clerk/nextjs";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { CircleIcon } from "lucide-react";

export const viewport: Viewport = {
  maximumScale: 1,
};

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Digi Baton",
  description: "Digi Baton",
};

function Header() {
  return (
    <header className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <CircleIcon className="h-6 w-6 text-orange-500" />
          <span className="ml-2 text-xl font-semibold text-gray-900">KeyPer</span>
        </Link>
        <div className="flex items-center space-x-4">
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ClerkProvider>
        <body className={`${notoSansJP.className} min-h-screen antialiased`}>
          <Header />
          {children}
        </body>
      </ClerkProvider>
    </html>
  );
}
