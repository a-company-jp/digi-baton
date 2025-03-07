"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import DashboardCard from "./dashboard-card";
import { UserIcon } from "lucide-react";
import type { HandlersAccountResponse } from "../api/generated/schemas/handlersAccountResponse";

const MAX_DISPLAY_ACCOUNTS = 6;

interface Account {
  id: string;
  appName: string;
  appIconUrl?: string;
  appDescription: string;
  username: string;
  encodedPassword: string;
}

interface AccountCardProps {
  accounts: HandlersAccountResponse[];
}

export default function AccountCard({
  accounts: accountsData,
}: AccountCardProps) {
  const accounts: Account[] = accountsData.map((account) => ({
    id: account.id?.toString() || "",
    appName: account.appName || "",
    appIconUrl: account.appIconUrl,
    appDescription: account.appDescription || "",
    username: account.accountUsername || account.email || "",
    encodedPassword: Buffer.from(account.encPassword || []).toString("base64"),
  }));
  const router = useRouter();

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
      {accounts.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          <p>アカウントがありません</p>
        </div>
      ) : (
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
      )}
    </DashboardCard>
  );
}
