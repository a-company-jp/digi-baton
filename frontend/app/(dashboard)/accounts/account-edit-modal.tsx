"use client";

import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HandlersAccountResponse } from "@/app/api/generated/schemas/handlersAccountResponse";
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
import { zodResolver } from "@hookform/resolvers/zod";
// Zodスキーマの定義
const accountSchema = z.object({
  id: z.number().optional(),
  appName: z.string().min(1, "アプリ名は必須です"),
  email: z.string().email("有効なメールアドレスを入力してください").optional(),
  accountUsername: z.string().optional(),
  appIconUrl: z.string().optional(),
  memo: z.string().optional(),
  trustID: z.number().optional(),
});

// スキーマから型を推論
type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountEditModalProps {
  account: HandlersAccountResponse;
  onSave: (updatedAccount: HandlersAccountResponse) => void;
}

export function AccountEditModal({ account, onSave }: AccountEditModalProps) {
  // react-hook-formとZodの統合
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      id: account.id,
      appName: account.appName || "",
      email: account.email || "",
      accountUsername: account.accountUsername || "",
      appIconUrl: account.appIconUrl || "",
      memo: account.memo || "",
      trustID: account.trustID,
    },
  });

  const handleSubmit = (values: AccountFormValues) => {
    try {
      // FormデータからAPIに渡すオブジェクトを作成
      const updatedAccount: HandlersAccountResponse = {
        ...account, // 元のデータを保持
        ...values, // 更新された値で上書き
      };

      onSave(updatedAccount);
      toast.success("アカウント情報を更新しました");
    } catch (error) {
      console.error("更新エラー:", error);
      toast.error("更新に失敗しました");
    }
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
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                          {account.appName?.charAt(0)}
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                          {account.appName?.charAt(0)}
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
          name="accountUsername"
          render={({ field }) => (
            <FormItem>
              <FormLabel>アカウント名</FormLabel>
              <FormControl>
                <Input {...field} placeholder="アカウント名を入力" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="memo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メモ</FormLabel>
              <FormControl>
                <Input {...field} placeholder="メモを入力" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trustID"
          render={({ field }) => (
            <FormItem>
              <FormLabel>信頼度</FormLabel>
              <FormControl>
                <Input {...field} type="number" placeholder="信頼度を入力" />
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
