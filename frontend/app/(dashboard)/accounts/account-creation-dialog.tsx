"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { HandlersAccountResponse } from "@/app/api/generated/schemas/handlersAccountResponse";
import { HandlersAccountCreateRequestBody } from "@/app/api/generated/schemas/handlersAccountCreateRequestBody";
import { postAccounts } from "@/app/api/generated/accounts/accounts";

// Zodスキーマの定義
const accountSchema = z.object({
  appName: z.string().min(1, "アプリ名は必須です"),
  email: z.string().email("有効なメールアドレスを入力してください").optional(),
  username: z.string().optional(),
  appIconUrl: z.string().optional(),
  memo: z.string().optional(),
});

// スキーマから型を推論
type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountCreationDialogProps {
  onSave: (account: HandlersAccountResponse) => void;
}

export function AccountCreationDialog({ onSave }: AccountCreationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // フォームの初期化
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      appName: "",
      email: "",
      username: "",
      appIconUrl: "",
      memo: "",
    },
  });

  const handleSubmit = async (values: AccountFormValues) => {
    try {
      setIsSubmitting(true);

      // APIリクエスト用のデータを作成
      const createData: HandlersAccountCreateRequestBody = {
        appName: values.appName,
        email: values.email,
        username: values.username,
        appIconUrl: values.appIconUrl,
        memo: values.memo,
      };

      // APIを呼び出してアカウントを作成
      const response = await postAccounts(createData);

      if (response.status === 200 && response.data) {
        onSave(response.data);
        toast.success("アカウントを作成しました");
        setIsOpen(false);
        form.reset();
      } else {
        toast.error("アカウントの作成に失敗しました");
      }
    } catch (error) {
      console.error("アカウント作成エラー:", error);
      toast.error("アカウントの作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          アカウント追加
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新規アカウント作成</DialogTitle>
        </DialogHeader>
        <DialogDescription>新規アカウントを作成します。</DialogDescription>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="appName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>アプリ名 *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="アプリ名を入力" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メールアドレス</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="メールアドレスを入力" />
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

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "作成中..." : "作成する"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
