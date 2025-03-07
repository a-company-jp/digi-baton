
import { AccountsTable } from "./accounts-table";
import { auth } from "@clerk/nextjs/server";
import { getAccounts } from "@/app/api/generated/accounts/accounts"; // 生成されたAPI関数を使用
import { HandlersAccountResponse } from "@/app/api/generated/schemas"; // 型定義をインポート
import { ErrorFlashMessage, TableTitle } from "../common";

export default async function AccountsPage() {
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

  // if (isError) {
  //   return <ErrorFlashMessage message="アカウント情報の取得中にエラーが発生しました。" />;
  // }

  return (
    <div className="p-6">
      <TableTitle title="アカウント" />
      <AccountsTable accountsData={accountsData} />
    </div>
  );
}
