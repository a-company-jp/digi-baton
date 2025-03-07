import { AlertCircle } from "lucide-react";
import { AccountsTable } from "./accounts-table";
import { AccountsCardView } from "./accounts-card-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth } from "@clerk/nextjs/server";
import { getAccounts } from "@/app/api/generated/accounts/accounts"; // 生成されたAPI関数を使用
import { HandlersAccountResponse } from "@/app/api/generated/schemas"; // 型定義をインポート

export default async function AccountsPage() {
  // デフォルトでテーブル表示
  // NOTE: あまり良くないかも
  const viewMode = "table";

  // Clerk認証を使用
  const authData = await auth();
  const token = await authData.getToken();

  // エラー状態とアカウントデータの初期化
  let isError = false;
  let accountsData: HandlersAccountResponse[] = [];

  try {
    // Server-side data fetching
    const response = await getAccounts({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // レスポンスからデータを取得
    if (response && "data" in response && Array.isArray(response.data)) {
      accountsData = response.data as HandlersAccountResponse[];
    }
  } catch (error) {
    console.error("Error fetching accounts:", error);
    isError = true;
  }

  // エラー状態の処理
  if (isError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>
            アカウント情報の取得中にエラーが発生しました。
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">アカウント</h1>
      </div>

      <div className="mt-6">
        {viewMode === "table" ? (
          <AccountsTable accountsData={accountsData} />
        ) : (
          <AccountsCardView accountsData={accountsData} />
        )}
      </div>
    </div>
  );
}
