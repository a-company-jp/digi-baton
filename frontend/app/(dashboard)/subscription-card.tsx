"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import DashboardCard from "./dashboard-card";
import { DollarSignIcon } from "lucide-react";
import type { HandlersSubscriptionResponse } from "../api/generated/schemas/handlersSubscriptionResponse";

const MAX_DISPLAY_SUBSCRIPTIONS = 6;

interface Subscription {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  appIconUrl?: string;
}

interface SubscriptionCardProps {
  subscriptions: HandlersSubscriptionResponse[];
}

export function SubscriptionCard({
  subscriptions: subscriptionsData,
}: SubscriptionCardProps) {
  const router = useRouter();

  // APIのレスポンスを変換
  const subscriptions: Subscription[] = subscriptionsData.map(
    (subscription) => ({
      id: subscription.id?.toString() || "",
      name: subscription.serviceName || "",
      price: subscription.amount || 0,
      currency: subscription.currency || "円",
      period: subscription.billingCycle || "月",
      appIconUrl: subscription.iconUrl,
    })
  );

  const getTotalPrice = () => {
    return subscriptions.reduce((total, sub) => total + sub.price, 0);
  };

  const handleManage = () => {
    return router.push("/subscriptions");
  };

  return (
    <DashboardCard
      title="サブスクリプション"
      description="サブリクリプションを登録して、不要な課金を防ぎましょう。"
      icon={<DollarSignIcon color="white" />}
      iconBgColor="bg-pink-400"
      count={subscriptions.length}
      countLabel="アカウント登録済み"
      onManage={handleManage}
    >
      {subscriptions.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          <p>サブスクリプションがありません</p>
        </div>
      ) : (
        <>
          <div className="bg-gray-50 p-4 rounded-md mb-6 flex justify-between items-center">
            <span className="text-gray-600">月の総額</span>
            <span className="text-xl font-bold">
              {getTotalPrice().toLocaleString()} 円
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {subscriptions
              .slice(0, MAX_DISPLAY_SUBSCRIPTIONS)
              .map((subscription) => (
                <div
                  key={subscription.id}
                  className="border rounded-md p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    {subscription.appIconUrl ? (
                      <Image
                        src={subscription.appIconUrl}
                        alt={subscription.name}
                        width={48}
                        height={48}
                        className="object-contain"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium">
                        {subscription.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">{subscription.name}</div>
                      <div className="text-xl font-bold">
                        {subscription.price.toLocaleString()}{" "}
                        <span className="text-sm font-normal text-gray-600">
                          {subscription.currency}/{subscription.period}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </DashboardCard>
  );
}
