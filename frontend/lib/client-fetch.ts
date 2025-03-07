'use client';

import ky from "ky";
import { useAuth } from "@clerk/nextjs";

const getUrl = (contextUrl: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
  const requestUrl = new URL(`${baseUrl}${contextUrl}`);
  return requestUrl.toString();
};

/**
 * クライアントコンポーネント用のAPI呼び出し関数
 * useAuthフックを使用して、トークンを取得し、APIリクエストに付与します
 */
export const useClientFetch = () => {
  const { getToken } = useAuth();

  const fetchData = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
    const requestUrl = getUrl(url);
    
    // Clerkのトークンを取得
    let authHeader = {};
    try {
      const token = await getToken();
      if (token) {
        authHeader = {
          Authorization: `Bearer ${token}`,
        };
      }
    } catch (error) {
      console.error("Failed to get auth token:", error);
    }

    const timeoutMS = 60 * 30 * 1000;
    const response = await ky(requestUrl, { 
      ...options, 
      timeout: timeoutMS,
      headers: {
        ...options.headers,
        ...authHeader,
      },
    });
    const data = await response.json<T>();

    return { status: response.status, data } as T;
  };

  return fetchData;
}; 