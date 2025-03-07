import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// absoluteURLを取得する関数
const getBaseUrl = () => {
  // ブラウザ環境ではwindowからベースURLを取得
  if (typeof window !== 'undefined') {
    return '';  // 相対パスを使用
  }
  // サーバー環境ではprocess.envから取得
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
};

// デフォルトのベースURL設定
const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
});

// リクエストインターセプターを設定
export const setupAuthInterceptor = (getToken: () => Promise<string | null>) => {
  const interceptorId = axiosInstance.interceptors.request.use(async (config) => {
    // Clerkからトークンを取得
    const token = await getToken();
    
    // トークンがあればAuthorizationヘッダーに設定
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  });

  // クリーンアップ関数を返す
  return () => {
    axiosInstance.interceptors.request.eject(interceptorId);
  };
};

// URLを正規化する関数
const normalizeUrl = (url: string): string => {
  // 絶対URLの場合はそのまま返す
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 相対パスの場合、先頭のスラッシュを確認
  return url.startsWith('/') ? url : `/${url}`;
};

// Orvalで使用するfetch関数
export default async function fetchWithAuth<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const config: AxiosRequestConfig = {
      url: normalizeUrl(url),
      method: options?.method || 'GET',
      headers: options?.headers as Record<string, string>,
    };

    // リクエストボディがある場合は追加
    if (options?.body) {
      config.data = JSON.parse(options.body as string);
    }

    const response: AxiosResponse<T> = await axiosInstance(config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      throw {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        headers: axiosError.response?.headers,
      };
    }
    throw error;
  }
} 