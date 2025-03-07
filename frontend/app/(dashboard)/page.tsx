import Image from "next/image";
import AccountCard from "./account-card";
import { SubscriptionCard } from "./subscription-card";
import { DeviceCard } from "./device-card";
import {
  HandlersAccountResponse,
  HandlersDeviceResponse,
  HandlersSubscriptionResponse,
} from "../api/generated/schemas";
import { auth } from "@clerk/nextjs/server";
import { getAccounts } from "../api/generated/accounts/accounts";
import { getSubscriptions } from "../api/generated/subscriptions/subscriptions";
import { getDevices } from "../api/generated/devices/devices";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function HomePage() {
  const authData = await auth();
  const token = await authData.getToken();

  let isError = false;
  let accountsData: HandlersAccountResponse[] = [];
  let subscriptionsData: HandlersSubscriptionResponse[] = [];
  let devicesData: HandlersDeviceResponse[] = [];

  try {
    const accountsRes = await getAccounts({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const subscriptionsRes = await getSubscriptions({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const devicesRes = await getDevices({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (accountsRes.status === 200 && Array.isArray(accountsRes.data)) {
      accountsData = accountsRes.data;
    }

    if (
      subscriptionsRes.status === 200 &&
      Array.isArray(subscriptionsRes.data)
    ) {
      subscriptionsData = subscriptionsRes.data;
    }

    if (devicesRes.status === 200 && Array.isArray(devicesRes.data)) {
      devicesData = devicesRes.data;
    }
  } catch (error) {
    console.error("Failed to fetch data:", error);
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
            データの取得中にエラーが発生しました。
          </AlertDescription>
        </Alert>
      </div>
    );
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
