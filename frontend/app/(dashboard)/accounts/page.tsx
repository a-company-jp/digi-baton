"use client";

import { useState } from "react";
import {
  LayoutGrid,
  Table as TableIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountsTable } from "./accounts-table";
import { AccountsCardView } from "./accounts-card-view";
import { useGetAccounts } from "@/app/api/generated/accounts/accounts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AccountsPage() {
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // アカウントデータの取得 (認証トークンは自動的に設定される)
  const { data: accountsData, isLoading, isError } = useGetAccounts();

  // APIレスポンスの安全な取得
  const accounts =
    accountsData?.data && Array.isArray(accountsData.data)
      ? accountsData.data
      : [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">アカウント</h1>
      </div>

      <div className="flex justify-between items-center my-4">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("table")}
            title="テーブル表示"
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("card")}
            title="カード表示"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">読み込み中...</span>
        </div>
      ) : isError ? (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>
            データの取得に失敗しました。もう一度お試しください。
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {viewMode === "table" ? (
            <AccountsTable accountsData={accounts} />
          ) : (
            <AccountsCardView accountsData={accounts} />
          )}
        </>
      )}
    </div>
  );
}
