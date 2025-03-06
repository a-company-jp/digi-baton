"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusIcon, ArrowLeft } from "lucide-react";
import { AccountTemplateSelector } from "./account-template-selector";
import { UserSelect } from "./user-select";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Account,
  AccountTemplate,
  users as mockUsers,
  accountTemplates as mockTemplates,
} from "./mock-data";

// Zodスキーマの定義
const accountSchema = z.object({
  id: z.string().optional(),
  appName: z.string().min(1, "アカウント名は必須です"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  encodedPassword: z.string().min(1, "パスワードは必須です"),
  inheritedUserId: z.string().min(1, "ユーザーを選択してください"),
  appIconUrl: z.string().optional(),
});

// スキーマから型を推論
type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountCreationDialogProps {
  onSave: (account: Account) => void;
}

export function AccountCreationDialog({ onSave }: AccountCreationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"template" | "edit">("template");
  const [templates, setTemplates] = useState<AccountTemplate[]>([]);

  // フォーム設定
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      id: "",
      appName: "",
      email: "",
      encodedPassword: "",
      inheritedUserId: "",
    },
  });

  // データの初期化と設定
  useEffect(() => {
    // テンプレートデータの取得
    // TODO: バックエンドのGoのAPIを叩いてデータを取得する予定
    // 現状はモックデータを使用
    setTemplates(mockTemplates);

    // デフォルトのユーザーを設定
    if (mockUsers.length > 0 && !form.getValues().inheritedUserId) {
      form.setValue("inheritedUserId", mockUsers[0].id);
    }
  }, [form]);

  // テンプレートが選択された時の処理
  const handleSelectTemplate = (template?: AccountTemplate) => {
    // テンプレートに基づいてフォームの値を設定
    if (template) {
      form.setValue("appName", template.appName || "");
      form.setValue("appIconUrl", template.appIconUrl || "");

      // メールドメインがあれば設定
      if (template.emailDomain) {
        form.setValue("email", `@${template.emailDomain}`);
      }
    }

    setStep("edit");
  };

  // フォーム送信処理
  const handleSubmit = (values: AccountFormValues) => {
    // Account型に変換
    const account: Account = {
      ...values,
      id: values.id || `new-${Date.now()}`,
      lastUpdated: new Date().toISOString().split("T")[0],
    };

    onSave(account);
    toast.success("アカウントが作成されました");

    // ダイアログを閉じて状態をリセット
    setIsOpen(false);
    setStep("template");
    form.reset();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setStep("template");
          form.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="h-4 w-4 mr-1" />
          アカウント追加
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === "template"
              ? "アカウント作成モード選択"
              : "アカウント詳細入力"}
          </DialogTitle>
        </DialogHeader>

        {step === "template" ? (
          <AccountTemplateSelector
            templates={templates}
            onSelect={handleSelectTemplate}
          />
        ) : (
          <>
            <div className="mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("template")}
                className="flex items-center text-sm text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                モード選択に戻る
              </Button>
            </div>

            {/* アカウント作成フォーム */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="appName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>アカウント名</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} type="email" />
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
                        <Input {...field} type="password" />
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

                <div className="flex justify-end w-full pt-4">
                  <Button type="submit">作成</Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
