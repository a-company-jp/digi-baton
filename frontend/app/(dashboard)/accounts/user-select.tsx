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
import { User, users as mockUsers } from "./mock-data";
import Image from "next/image";

interface UserSelectProps {
  selectedUserId: string | undefined;
  onSelect: (userId: string) => void;
}

export function UserSelect({ selectedUserId, onSelect }: UserSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);

  // ユーザーデータの取得
  useEffect(() => {
    // TODO: バックエンドのGoのAPIを叩いてユーザーデータを取得する予定
    // 例: fetch('/api/users').then(res => res.json()).then(data => setUsers(data));

    // 現状はモックデータを使用
    setUsers(mockUsers);
  }, []);

  // 選択されているユーザーを取得
  const selectedUser = selectedUserId
    ? users.find((user) => user.id === selectedUserId)
    : undefined;

  // 確実に配列が存在することを保証
  const safeUsers = Array.isArray(users) ? users : [];

  // 検索クエリに基づいてフィルタリング
  const filteredUsers = safeUsers.filter((user) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  // コマンドアイテムが選択されたときの処理
  const handleSelect = (userId: string) => {
    onSelect(userId);
    setOpen(false);
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
              {selectedUser.avatarUrl ? (
                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={selectedUser.avatarUrl}
                    alt={selectedUser.name}
                    width={24}
                    height={24}
                  />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs flex-shrink-0">
                  {selectedUser.name.charAt(0)}
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
            {filteredUsers.length === 0 && (
              <CommandEmpty>ユーザーが見つかりません</CommandEmpty>
            )}
            <CommandGroup>
              {filteredUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => handleSelect(user.id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    {user.avatarUrl ? (
                      <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={user.avatarUrl}
                          alt={user.name}
                          width={24}
                          height={24}
                        />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs flex-shrink-0">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <span className="flex-1 truncate">{user.name}</span>
                    <span className="text-xs text-gray-500 truncate">
                      {user.email}
                    </span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedUserId === user.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
