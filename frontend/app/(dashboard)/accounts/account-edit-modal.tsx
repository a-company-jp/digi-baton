"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Account } from "./mock-data";
import { UserSelect } from "./user-select";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Image from "next/image";

// Zodスキーマの定義
const accountSchema = z.object({
  id: z.string(),
  appName: z.string().min(1, "アカウント名は必須です"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  encodedPassword: z
    .string()
    .min(6, "パスワードは6文字以上である必要があります"),
  inheritedUserId: z.string().min(1, "ユーザーを選択してください"),
  appIconUrl: z.string().optional(),
  lastUpdated: z.string(),
});

// スキーマから型を推論
type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountEditModalProps {
  account: Account;
  onSave: (updatedAccount: Account) => void;
}

export function AccountEditModal({ account, onSave }: AccountEditModalProps) {
  // react-hook-formとZodの統合
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: account,
  });

  const handleSubmit = (values: AccountFormValues) => {
    // アカウント更新時に最終更新日を更新
    const updatedAccount: Account = {
      ...values,
      lastUpdated: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD format
    };

    onSave(updatedAccount);
    toast.success("アカウントが更新されました");
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 mt-4"
      >
        <FormField
          control={form.control}
          name="appName"
          render={({ field }) => {
            return (
              <FormItem>
                <div className="mb-2">
                  {/* アプリアイコンの表示 */}
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 aspect-square flex-shrink-0 flex items-center justify-center rounded-md bg-gray-50 overflow-hidden">
                      {account.appIconUrl ? (
                        <Image
                          src={account.appIconUrl}
                          alt={account.appName}
                          width={24}
                          height={24}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                          {account.appName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <FormControl>
                      <Input {...field} placeholder="Google、LinkedIn など" />
                    </FormControl>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="appIconUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>アイコンURL</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ""}
                  placeholder="https://example.com/icon.png"
                />
              </FormControl>
              <FormDescription className="text-xs">
                アイコン画像のURLを入力すると、アカウントにアイコンが表示されます
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メールアドレス</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="example@email.com"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="encodedPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>パスワード</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder="パスワードを入力"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="inheritedUserId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>継承ユーザー</FormLabel>
              <FormControl>
                <UserSelect
                  selectedUserId={field.value}
                  onSelect={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit">更新</Button>
        </div>
      </form>
    </Form>
  );
}
