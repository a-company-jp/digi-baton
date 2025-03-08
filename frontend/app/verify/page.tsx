"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Check, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Component that uses useSearchParams
function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const disclosureId = searchParams.get("disclosure_id");

  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [disclosureStatus, setDisclosureStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("トークンが見つかりませんでした。URLを確認してください。");
        return;
      }

      setIsLoading(true);
      try {
        const requestBody: { token: string; disclosure_id?: number } = {
          token,
        };

        // disclosure_idが存在する場合は追加
        if (disclosureId) {
          requestBody.disclosure_id = parseInt(disclosureId, 10);
        }

        const response = await fetch("/api/verify/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "検証中にエラーが発生しました");
        }

        const data = await response.json();
        setIsVerified(data.validated);
        if (data.disclosure_status) {
          setDisclosureStatus(data.disclosure_status);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("不明なエラーが発生しました");
        }
        setIsVerified(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token, disclosureId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">アカウント確認</CardTitle>
        <CardDescription className="text-center">
          {isLoading ? "検証中..." : "アカウントの存在確認を行っています"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        {isLoading ? (
          <div className="my-8 flex flex-col items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
            <p className="mt-4 text-sm text-gray-500">処理中です...</p>
          </div>
        ) : isVerified ? (
          <div className="my-8 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-green-100 p-3">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium">確認完了</h3>
            <p className="mt-2 text-sm text-gray-500">
              アカウントの存在確認が完了しました。
            </p>
            {disclosureStatus && (
              <p className="mt-2 text-sm font-medium text-blue-600">
                {disclosureStatus}
              </p>
            )}
            <Button asChild className="mt-6">
              <Link href="/">ホームへ戻る</Link>
            </Button>
          </div>
        ) : (
          <div className="my-8 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-red-100 p-3">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium">確認失敗</h3>
            <p className="mt-2 text-sm text-gray-500">
              {error || "アカウントの確認中にエラーが発生しました。"}
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/">ホームへ戻る</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Loading fallback component
function VerifyLoading() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">アカウント確認</CardTitle>
        <CardDescription className="text-center">読み込み中...</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        <div className="my-8 flex flex-col items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
          <p className="mt-4 text-sm text-gray-500">読み込み中...</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Main page component with Suspense boundary
export default function VerifyPage() {
  return (
    <div className="container mx-auto max-w-md py-24">
      <Suspense fallback={<VerifyLoading />}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
