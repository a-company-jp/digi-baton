"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@clerk/nextjs";
import { PlusCircle, Loader2 } from "lucide-react";
import {
  HandlersReceiverResponse,
  HandlersDisclosureCreateRequest,
} from "@/app/api/generated/schemas";
import { toast } from "sonner";
import Image from "next/image";
import { getReceivers } from "@/app/api/generated/receivers/receivers";
import { postDisclosures } from "@/app/api/generated/disclosures/disclosures";

// バリデーションスキーマ
const formSchema = z.object({
  passerId: z.string({
    required_error: "相続人を選択してください",
  }),
  deadlineDuration: z.coerce
    .number({
      required_error: "有効期限を入力してください",
    })
    .min(1, {
      message: "有効期限は1日以上である必要があります",
    })
    .max(365, {
      message: "有効期限は365日以下にしてください",
    }),
});

type FormValues = z.infer<typeof formSchema>;

interface DisclosureCreationDialogProps {
  onSuccessfulCreation: () => void;
}

export function DisclosureCreationDialog({
  onSuccessfulCreation,
}: DisclosureCreationDialogProps) {
  const [open, setOpen] = useState(false);
  const [receivers, setReceivers] = useState<HandlersReceiverResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();

  // フォーム初期化
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deadlineDuration: 30, // 30日をデフォルト値に
    },
  });

  // 受取人（receivers）データを取得
  useEffect(() => {
    const fetchReceivers = async () => {
      try {
        const token = await getToken();
        const response = await getReceivers({
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response && response.data && Array.isArray(response.data)) {
          setReceivers(response.data);
        }
      } catch (error) {
        console.error("Error fetching receivers:", error);
        toast.error("受取人データの取得に失敗しました");
      }
    };

    if (open) {
      fetchReceivers();
    }
  }, [getToken, open]);

  // フォーム送信処理
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const token = await getToken();

      // リクエスト作成 - カスタムデータなし
      const request: HandlersDisclosureCreateRequest = {
        passerID: values.passerId,
        deadlineDuration: values.deadlineDuration,
      };

      const res = await postDisclosures(request, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res && res.data) {
        // 成功時の処理
        toast.success("相続申請が作成されました");
        setOpen(false);
        form.reset();
        onSuccessfulCreation();
      } else {
        throw new Error("API request failed");
      }
    } catch (error) {
      console.error("Error creating disclosure:", error);
      toast.error("相続申請の作成に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          新規相続申請
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新規相続申請</DialogTitle>
          <DialogDescription>
            相続人を選択して新しい相続申請を作成します。
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4"
          >
            <FormField
              control={form.control}
              name="passerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>相続人</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="相続人を選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {receivers.map((receiver) => (
                        <SelectItem
                          key={receiver.clerkUserId}
                          value={receiver.userId || ""}
                        >
                          <div className="flex items-center gap-2">
                            {receiver.iconUrl ? (
                              <Image
                                src={receiver.iconUrl}
                                alt={receiver.name || ""}
                                width={20}
                                height={20}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs">
                                {receiver.name?.charAt(0) || "?"}
                              </div>
                            )}
                            <span>{receiver.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deadlineDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>有効期限（日数）</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                申請作成
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
