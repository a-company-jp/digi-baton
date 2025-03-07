"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { useGetReceivers } from "@/app/api/generated/receivers/receivers";
import { HandlersReceiverResponse } from "@/app/api/generated/schemas";

interface TrustUserSelectProps {
  selectedUserId: string | number | undefined;
  onSelect: (userId: string) => void;
}

export function TrustUserSelect({
  selectedUserId,
  onSelect,
}: TrustUserSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const { getToken } = useAuth();

  // TokenをSecureに取得
  useEffect(() => {
    (async () => {
      const t = await getToken();
      setToken(t);
    })();
  }, [getToken]);

  const { data, isLoading: isTrustUsersLoading } = useGetReceivers({
    query: {
      enabled: !!token,
    },
    request: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // APIレスポンスからtrustsUsersを抽出
  const trustUsers: HandlersReceiverResponse[] =
    data?.status === 200 ? data.data : [];

  // 選択されているユーザーを取得
  const selectedUser = selectedUserId
    ? trustUsers.find(
        (user) =>
          user.id === Number(selectedUserId) || user.id === selectedUserId
      )
    : undefined;

  // 検索クエリに基づいてフィルタリング
  const filteredUsers = trustUsers.filter((user) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(query) ||
      false ||
      user.email?.toLowerCase().includes(query) ||
      false
    );
  });

  // コマンドアイテムが選択されたときの処理
  const handleSelect = (userId: string | number | undefined) => {
    if (userId !== undefined) {
      onSelect(String(userId));
      setOpen(false);
    }
  };

  // ユーザーが選択されていない場合のボタンスタイル
  const buttonStyles = cn(
    "w-full justify-between",
    !selectedUser && "border-red-300 focus:ring-red-500"
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={buttonStyles}
        >
          {selectedUser ? (
            <div className="flex items-center gap-2">
              {selectedUser.iconUrl ? (
                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={selectedUser.iconUrl}
                    alt={selectedUser.name || ""}
                    width={24}
                    height={24}
                  />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs flex-shrink-0">
                  {selectedUser.name ? selectedUser.name.charAt(0) : ""}
                </div>
              )}
              <span className="truncate">
                {selectedUser.name} ({selectedUser.email})
              </span>
            </div>
          ) : (
            <span className="text-rose-500">
              相続ユーザーを選択してください
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="ユーザーを検索..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isTrustUsersLoading ? (
              <CommandEmpty>読み込み中...</CommandEmpty>
            ) : filteredUsers.length === 0 ? (
              <CommandEmpty>ユーザーが見つかりません</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    onSelect={() => handleSelect(user.id)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {user.iconUrl ? (
                        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={user.iconUrl}
                            alt={user.name || ""}
                            width={24}
                            height={24}
                          />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs flex-shrink-0">
                          {user.name ? user.name.charAt(0) : ""}
                        </div>
                      )}
                      <span className="flex-1 truncate">{user.name}</span>
                      <span className="text-xs text-gray-500 truncate">
                        {user.email}
                      </span>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedUserId === user.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
