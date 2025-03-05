"use client";
import { useEffect, useState } from "react";
import DashboardCard from "./dashboard-card";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DollarSignIcon } from "lucide-react";

const MAX_DISPLAY_SUBSCRIPTIONS = 6;

interface Subscription {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  appIconUrl?: string;
}

export function SubscriptionCard() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const router = useRouter();

  // 将来的にはここでAPIを呼び出し
  useEffect(() => {
    // call API

    // mock data
    setSubscriptions([
      {
        id: "1",
        name: "Youtube Premium",
        price: 3300,
        currency: "円",
        period: "月",
        appIconUrl: "/icons/youtube_premium.jpg",
      },
      {
        id: "2",
        name: "Amazon Prime Video",
        price: 500,
        currency: "円",
        period: "月",
        appIconUrl: "/icons/prime_video.png",
      },
      {
        id: "3",
        name: "Apple Music",
        price: 1000,
        currency: "円",
        period: "月",
      },
      {
        id: "4",
        name: "Spotify Premium",
        price: 1000,
        currency: "円",
        period: "月",
      },
      {
        id: "5",
        name: "U-Next",
        price: 1000,
        currency: "円",
        period: "月",
      },
      {
        id: "6",
        name: "Disney+",
        price: 1000,
        currency: "円",
        period: "月",
      },
      {
        id: "7",
        name: "Hulu",
        price: 1000,
        currency: "円",
        period: "月",
      },
    ]);
  }, []);

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
    </DashboardCard>
  );
}
