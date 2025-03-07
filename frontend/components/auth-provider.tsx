"use client";

import { useAuth } from "@clerk/nextjs";
import { ReactNode, createContext, useEffect } from "react";
import { setupAuthInterceptor } from "@/lib/fetch";

// 認証コンテキスト（必要に応じて）
export const AuthContext = createContext<string | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { getToken } = useAuth();

  // アプリマウント時に認証インターセプターを設定
  useEffect(() => {
    // インターセプターを設定
    const cleanup = setupAuthInterceptor(getToken);

    // アンマウント時にクリーンアップ
    return () => {
      cleanup();
    };
  }, [getToken]);

  return <>{children}</>;
}
