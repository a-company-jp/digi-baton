import ky from "ky";
import { auth } from "@clerk/nextjs/server";

/**
 * このファイルはサーバーコンポーネント用のAPIリクエスト関数です。
 * クライアントコンポーネント（'use client'）で使用する場合は、
 * lib/client-fetch.ts の useClientFetch() フックを使用してください。
 */

const getUrl = (contextUrl: string): string => {
  const baseUrl = process.env.API_URL || "http://localhost:8080/api";
  const requestUrl = new URL(`${baseUrl}${contextUrl}`);
  return requestUrl.toString();
};

// 無名関数を変数に代入してからエクスポート
const fetchWithAuth = async <T>(url: string, options: RequestInit): Promise<T> => {
  const requestUrl = getUrl(url);
  
  // Clerkのトークンを取得
  let authHeader = {};
  try {
    const authObj = await auth();
    const token = await authObj.getToken();
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

// デフォルトエクスポート
export default fetchWithAuth;
