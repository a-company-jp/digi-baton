"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import DashboardCard from "./dashboard-card";
import { UserIcon } from "lucide-react";

const MAX_DISPLAY_ACCOUNTS = 6;

interface Account {
  id: string;
  appName: string;
  appIconUrl?: string;
  appDescription: string;
  username: string;
  encodedPassword: string;
}

export default function AccountCard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const router = useRouter();

  useEffect(() => {
    // call API

    // mock data
    setAccounts([
      {
        id: "1",
        appName: "Google",
        appDescription: "Googleアカウント",
        username: "test@example.com",
        encodedPassword: "encodedPassword",
        appIconUrl: "/icons/google.png",
      },
      {
        id: "2",
        appName: "Spotify",
        appDescription: "Spotifyアカウント",
        username: "test@example.com",
        encodedPassword: "encodedPassword",
      },
      {
        id: "3",
        appName: "X",
        appDescription: "Xアカウント",
        username: "test@example.com",
        encodedPassword: "encodedPassword",
      },
      {
        id: "4",
        appName: "Instagram",
        appDescription: "Instagramアカウント",
        username: "test@example.com",
        encodedPassword: "encodedPassword",
      },
      {
        id: "5",
        appName: "Facebook",
        appDescription: "Facebookアカウント",
        username: "test@example.com",
        encodedPassword: "encodedPassword",
      },
      {
        id: "6",
        appName: "LinkedIn",
        appDescription: "LinkedInアカウント",
        username: "test@example.com",
        encodedPassword: "encodedPassword",
      },
      {
        id: "7",
        appName: "GitHub",
        appDescription: "GitHubアカウント",
        username: "test@example.com",
        encodedPassword: "encodedPassword",
      },
    ]);
  }, []);

  const handleOnManage = () => {
    return router.push("/accounts");
  };

  return (
    <DashboardCard
      title="アカウント"
      description="SNSなどのアカウントを登録しましょう。"
      onManage={handleOnManage}
      icon={<UserIcon color="white" />}
      iconBgColor="bg-blue-500"
      count={accounts.length}
      countLabel="アカウント数"
    >
      <div className="grid grid-cols-6 gap-4 mb-6">
        {accounts.slice(0, MAX_DISPLAY_ACCOUNTS).map((account) => (
          <div
            key={account.id}
            className="flex justify-center items-center p-4 border rounded-md"
          >
            {account.appIconUrl ? (
              <Image
                src={account.appIconUrl}
                alt={account.appName}
                width={32}
                height={32}
                className="object-contain"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium">
                {account.appName.charAt(0)}
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
