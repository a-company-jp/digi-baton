import React from "react";
import { getAccounts } from "@/app/api/generated/accounts/accounts";
import { HandlersAccountResponse } from "@/app/api/generated/schemas";

async function Accounts() {
  // アカウントリストを取得
  let accounts: HandlersAccountResponse[] = [];
  let error = null;

  try {
    const response = await getAccounts();
    if (response.status === 200) {
      accounts = response.data;
    } else {
      error = `エラーが発生しました: ${response.status}`;
    }
  } catch (err) {
    console.error("アカウント取得エラー:", err);
    error = "アカウントの取得中にエラーが発生しました";
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">アカウント一覧</h1>

      {error && (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6"
          role="alert"
        >
          <p>{error}</p>
        </div>
      )}

      {accounts.length === 0 && !error ? (
        <div className="text-center py-8 text-gray-500">
          アカウントがありません
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account, index) => (
            <div
              key={account.id || index}
              className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  {account.appIconUrl ? (
                    <img
                      src={account.appIconUrl}
                      alt={account.appName || "アプリアイコン"}
                      className="w-12 h-12 mr-4 rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 mr-4 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-500">No icon</span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold">
                      {account.appName || "No Name"}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {account.accountUsername || "No Username"}
                    </p>
                  </div>
                </div>

                {account.appDescription && (
                  <p className="text-gray-700 mb-3 text-sm">
                    {account.appDescription}
                  </p>
                )}

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium">
                      {account.email || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">公開状態:</span>
                    <span
                      className={`font-medium ${account.isDisclosed ? "text-green-600" : "text-red-600"}`}
                    >
                      {account.isDisclosed ? "公開中" : "非公開"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Accounts;
