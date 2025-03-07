"use client";

import { useEffect, useState } from "react";
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
import { ArrowLeft, PlusIcon } from "lucide-react";
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
import {
  postAccounts,
  useGetAccountsTemplates,
} from "@/app/api/generated/accounts/accounts";
import { AccountTemplateSelector } from "./account-template-selector";
import { HandlersAccountTemplateResponse } from "@/app/api/generated/schemas";
import { useAuth } from "@clerk/nextjs";
import { useGetUsers } from "@/app/api/generated/users/users";
import { TrustUserSelect } from "./trust-user-select";

// Zodスキーマの定義
const accountSchema = z.object({
  appName: z.string().min(1, "アプリ名は必須です"),
  appDescription: z.string().optional(),
  appIconUrl: z.string().optional(),
  email: z.string().email("有効なメールアドレスを入力してください").optional(),
  username: z.string().optional(),
  password: z.string().min(1, "パスワードは必須です"),
  trustID: z.number().nonnegative("信頼ユーザーは必須です"),
  memo: z.string().optional(),
});

// スキーマから型を推論
type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountCreationDialogProps {
  onSave: (account: HandlersAccountResponse) => void;
}

export function AccountCreationDialog({ onSave }: AccountCreationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"template" | "edit">("template");
  const [selectedTemplateId, setSelectedTemplateId] = useState<
    number | undefined
  >(undefined);
  const [token, setToken] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    (async () => {
      const t = await getToken();
      setToken(t);
    })();
  }, [getToken]);

  const { data: user } = useGetUsers({
    query: {
      enabled: !!token,
    },
    request: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
  const { data: templates, isLoading: isTemplatesLoading } =
    useGetAccountsTemplates({
      query: {
        enabled: !!token,
      },
      request: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

  // フォームの初期化
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      trustID: -1,
    },
  });

  const handleSubmit = async (values: AccountFormValues) => {
    try {
      // APIリクエスト用のデータを作成
      // アプリ情報の基本データを作成
      const appBaseData = {
        appName: values.appName,
        appDescription: values.appDescription,
        appIconUrl: values.appIconUrl,
      };

      // テンプレートIDがある場合は追加
      const appData = selectedTemplateId
        ? { ...appBaseData, appTemplateID: selectedTemplateId }
        : appBaseData;

      if (!user) {
        toast.error("ユーザー情報を取得できませんでした");
        return;
      }
      // APIリクエスト用のデータを作成
      const createData: HandlersAccountCreateRequestBody = {
        ...appData,
        email: values.email,
        username: values.username,
        memo: values.memo,
        trustID: values.trustID,
        password: values.password,
        plsDelete: false, // NOTE: 今後実装
        passerID: user.data.userID,
      };

      // APIを呼び出してアカウントを作成
      const response = await postAccounts(createData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
    }
  };

  // テンプレートが選択された時の処理
  const handleSelectTemplate = (template?: HandlersAccountTemplateResponse) => {
    // テンプレートに基づいてフォームの値を設定
    if (template) {
      form.setValue("appName", template.appName || "");
      form.setValue("appIconUrl", template.appIconUrl || "");
      form.setValue("appDescription", template.appDescription || "");

      setSelectedTemplateId(template.id);
    } else {
      setSelectedTemplateId(undefined);
    }

    setStep("edit");
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
          <DialogDescription>
            {step === "template"
              ? "アカウント作成モードを選択してください"
              : "アカウントの詳細を入力してください"}
          </DialogDescription>
        </DialogHeader>

        {step === "template" ? (
          <AccountTemplateSelector
            isLoading={isTemplatesLoading}
            templates={templates?.data || []}
            onSelect={handleSelectTemplate}
          />
        ) : (
          <>
            <div className="mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStep("template");
                  setSelectedTemplateId(undefined);
                }}
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
                  name="appDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>アプリの説明</FormLabel>
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
                  name="password"
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
                  name="trustID"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>信頼ユーザー</FormLabel>
                      <FormControl>
                        <TrustUserSelect
                          selectedTrustUserId={field.value}
                          onSelect={(trustId: number) =>
                            field.onChange(trustId)
                          }
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
