import ky from "ky";

const getUrl = (contextUrl: string): string => {
  const baseUrl = process.env.API_URL || "http://localhost:8080/api";
  const requestUrl = new URL(`${baseUrl}${contextUrl}`);
  return requestUrl.toString();
};

export default async <T>(url: string, options: RequestInit): Promise<T> => {
  const requestUrl = getUrl(url);

  const timeoutMS = 60 * 30 * 1000;
  const response = await ky(requestUrl, { ...options, timeout: timeoutMS });
  const data = await response.json<T>();

  return { status: response.status, data } as T;
};
