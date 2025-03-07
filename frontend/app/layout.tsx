import { type Metadata, Viewport } from "next";
import { ClerkProvider, SignedIn, UserButton } from "@clerk/nextjs";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { CircleIcon } from "lucide-react";
import QueryProvider from "./query_provider";
import { Toaster } from "@/components/ui/sonner";

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <CircleIcon className="h-6 w-6 text-orange-500" />
          <span className="ml-2 text-xl font-semibold text-gray-900">
            KeyPer
          </span>
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
        <QueryProvider>
          <body
            className={`${notoSansJP.className} min-h-screen antialiased bg-gray-50`}
          >
            <Header />
            <div className="pt-[60px]">{children}</div>
            <Toaster />
          </body>
        </QueryProvider>
      </ClerkProvider>
    </html>
  );
}
