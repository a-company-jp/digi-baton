'use client';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/nextjs";
import { useState } from "react";

export default function QueryProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // QueryClientをコンポーネント内で初期化
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider>
        {children}
      </ClerkProvider>
    </QueryClientProvider>
  );
}
