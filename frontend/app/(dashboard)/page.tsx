import Image from "next/image";
import AccountCard from "./account-card";
import { SubscriptionCard } from "./subscription-card";
import { DeviceCard } from "./device-card";
import { getAccounts } from "../api/generated/accounts/accounts";
import { getDevices } from "../api/generated/devices/devices";
import { getSubscriptions } from "../api/generated/subscriptions/subscriptions";
import type { HandlersAccountResponse } from "../api/generated/schemas/handlersAccountResponse";
import type { HandlersDeviceResponse } from "../api/generated/schemas/handlersDeviceResponse";
import type { HandlersSubscriptionResponse } from "../api/generated/schemas/handlersSubscriptionResponse";

export default async function HomePage() {
  // サーバーコンポーネントでデータを取得
  let accountsData: HandlersAccountResponse[] = [];
  let devicesData: HandlersDeviceResponse[] = [];
  let subscriptionsData: HandlersSubscriptionResponse[] = [];

  try {
    // 並行してデータを取得
    const [accountsResponse, devicesResponse, subscriptionsResponse] =
      await Promise.all([getAccounts(), getDevices(), getSubscriptions()]);

    // アカウントデータを設定
    if (
      accountsResponse.status === 200 &&
      Array.isArray(accountsResponse.data)
    ) {
      accountsData = accountsResponse.data;
    }

    // デバイスデータを設定
    if (devicesResponse.status === 200 && Array.isArray(devicesResponse.data)) {
      devicesData = devicesResponse.data;
    }

    // サブスクリプションデータを設定
    if (
      subscriptionsResponse.status === 200 &&
      Array.isArray(subscriptionsResponse.data)
    ) {
      subscriptionsData = subscriptionsResponse.data;
    }
  } catch (error) {
    console.error("Failed to fetch data:", error);
    // エラーロギングやエラーハンドリングをここで行う
  }

  return (
    <main className="flex-1 p-4 lg:p-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-lg bg-blue-800">
          <Image
            src="/imgs/welcome_icon.png"
            alt="Welcome"
            width={150}
            height={150}
            className="object-contain"
          />
          <div>
            <h1 className="text-white text-lg lg:text-2xl font-bold truncate">
              <span className="hidden md:inline">
                今すぐ連携し、もしものときに備えましょう。
              </span>
              <span className="md:hidden">もしものときに備えましょう。</span>
            </h1>
            <p className="mt-4 text-gray-100 line-clamp-2">
              <span className="hidden md:inline">
                <span className="font-bold">KeyPer</span>
                を使ってアカウント情報やデバイス情報を入力することで、
                もしものときに引き継ぎが迅速に行えます。
              </span>
              <span className="md:hidden">
                あなたのアカウントやデバイスの情報を登録しましょう。
              </span>
            </p>
          </div>
        </div>
        <AccountCard accounts={accountsData} />
        <SubscriptionCard subscriptions={subscriptionsData} />
        <DeviceCard devices={devicesData} />
      </div>
    </main>
  );
}
