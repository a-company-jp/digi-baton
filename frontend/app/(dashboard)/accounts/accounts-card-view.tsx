"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PencilIcon, SearchIcon, Copy, Check, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { HandlersAccountResponse } from "@/app/api/generated/schemas/handlersAccountResponse";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AccountEditModal } from "./account-edit-modal";
import { AccountCreationDialog } from "./account-creation-dialog";
import { toast } from "sonner";

interface AccountCardProps {
  account: HandlersAccountResponse;
  onCopy: (text: string, label: string) => void;
}

function AccountCard({ account, onCopy }: AccountCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleCopyEmail = () => {
    if (account.email) {
      onCopy(account.email, "メールアドレス");
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleCopyPassword = () => {
    onCopy("********", "パスワード"); // 実際には復号化したパスワードを使用
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-md bg-gray-50">
            {account.appIconUrl ? (
              <Image
                src={account.appIconUrl}
                alt={account.appName || ""}
                width={24}
                height={24}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                {account.appName?.charAt(0) || "?"}
              </div>
            )}
          </div>
          <CardTitle className="text-lg">
            {account.appName || "不明なアプリ"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {account.email && (
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">
                  メールアドレス
                </p>
                <div className="flex items-center">
                  <p className="text-sm mr-2">{account.email}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyEmail}
                    className="h-8 w-8 opacity-70 hover:opacity-100"
                  >
                    {copiedEmail ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">パスワード</p>
              <div className="flex items-center">
                <p className="text-sm mr-2">
                  {showPassword ? "********" : "••••••••"}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyPassword}
                  className="h-8 w-8 ml-2 opacity-70 hover:opacity-100"
                >
                  {copiedPassword ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePasswordVisibility}
                  className="h-8 w-8 opacity-70 hover:opacity-100"
                >
                  {showPassword ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <PencilIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>アカウント編集</DialogTitle>
            </DialogHeader>
            <AccountEditModal
              account={account}
              onSave={(updatedAccount) => {
                console.log("アカウント更新:", updatedAccount);
                setIsOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}

interface AccountsCardViewProps {
  accountsData: HandlersAccountResponse[];
}

export function AccountsCardView({ accountsData }: AccountsCardViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // 検索フィルター
  const filteredAccounts = accountsData.filter(
    (account) =>
      (account.appName &&
        account.appName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (account.email &&
        account.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // クリップボードにコピーする関数
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast("コピーしました", {
      description: `${label}をクリップボードにコピーしました。`,
      duration: 2000,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 w-80"
          />
        </div>
        <AccountCreationDialog
          onSave={(newAccount) => {
            console.log("新規アカウント:", newAccount);
            toast.success("アカウントを作成しました");
          }}
        />
      </div>

      {filteredAccounts.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <p className="text-muted-foreground">
            登録されたアカウントがありません
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onCopy={copyToClipboard}
            />
          ))}
        </div>
      )}
    </div>
  );
}
