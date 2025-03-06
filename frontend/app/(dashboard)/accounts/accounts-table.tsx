"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Copy,
  Check,
  Eye,
  EyeOff,
  SearchIcon,
  Pencil,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import {
  Account,
  accounts as mockAccounts,
  User,
  users as mockUsers,
} from "./mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { AccountEditModal } from "./account-edit-modal";
import { AccountCreationDialog } from "./account-creation-dialog";
import { toast } from "sonner";

// 値のコピーボタン付きテキストセル
function CopyableCell({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast("コピーしました", {
      description: `${label}をクリップボードにコピーしました。`,
      duration: 2000,
    });
  };

  return (
    <div className="flex items-center justify-between">
      <span>{value}</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={copyToClipboard}
        className="h-8 w-8 ml-2 opacity-70 hover:opacity-100"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

// パスワードセル
function PasswordCell({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast("コピーしました", {
      description: `パスワードをクリップボードにコピーしました。`,
      duration: 2000,
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex items-center justify-between">
      <span>{showPassword ? value : "••••••••"}</span>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={copyToClipboard}
          className="h-8 w-8 ml-2 opacity-70 hover:opacity-100"
        >
          {copied ? (
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
  );
}

// 編集ボタンセル
function ActionCell({
  account,
  onDelete,
}: {
  account: Account;
  onDelete: (id: string) => void;
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <div className="flex items-center space-x-1">
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>アカウント編集</DialogTitle>
          </DialogHeader>
          <AccountEditModal
            account={account}
            onSave={(updatedAccount: Account) => {
              // 実際のアプリケーションではここでデータ更新処理を行う
              console.log("アカウント更新:", updatedAccount);
              setIsEditOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>アカウント削除の確認</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>「{account.appName}」のアカウントを削除してもよろしいですか？</p>
            <p className="text-sm text-muted-foreground mt-2">
              この操作は元に戻せません。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(account.id);
                setIsDeleteOpen(false);
              }}
            >
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 相続ユーザーセル
function InheritUserCell({ value, users }: { value: string; users: User[] }) {
  const user = users.find((user) => user.id === value);
  if (!user) {
    return <span className="text-sm font-semibold text-rose-500">未選択</span>;
  }

  return (
    <div className="flex items-center gap-2">
      {user.avatarUrl ? (
        <div className="w-6 h-6 rounded-full overflow-hidden">
          <Image src={user.avatarUrl} alt={user.name} width={24} height={24} />
        </div>
      ) : (
        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">
          {user.name.charAt(0)}
        </div>
      )}
      <span>{user.name}</span>
    </div>
  );
}

// メタデータの型定義
interface TableCustomMeta {
  users?: User[];
  onDeleteAccount?: (id: string) => void;
}

// テーブルのカラム定義
const columns: ColumnDef<Account>[] = [
  {
    accessorKey: "appName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          アプリ
          {{
            asc: <ChevronUp className="ml-2 h-4 w-4" />,
            desc: <ChevronDown className="ml-2 h-4 w-4" />,
          }[column.getIsSorted() as string] ?? (
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const account = row.original;
      return (
        <div className="flex items-center">
          <div className="h-10 w-10 flex items-center justify-center rounded-md bg-gray-50 mr-3">
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
          <span>{account.appName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          メールアドレス
          {{
            asc: <ChevronUp className="ml-2 h-4 w-4" />,
            desc: <ChevronDown className="ml-2 h-4 w-4" />,
          }[column.getIsSorted() as string] ?? (
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => (
      <CopyableCell
        value={row.getValue("email") as string}
        label="メールアドレス"
      />
    ),
  },
  {
    accessorKey: "encodedPassword",
    header: "パスワード",
    cell: ({ row }) => (
      <PasswordCell value={row.getValue("encodedPassword") as string} />
    ),
  },
  {
    accessorKey: "inheritedUserId",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          相続ユーザー
          {{
            asc: <ChevronUp className="ml-2 h-4 w-4" />,
            desc: <ChevronDown className="ml-2 h-4 w-4" />,
          }[column.getIsSorted() as string] ?? (
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row, table }) => {
      // AccountsTableコンポーネントのstateにアクセス
      const users = (table.options.meta as TableCustomMeta)?.users || [];
      return (
        <InheritUserCell
          value={row.getValue("inheritedUserId") as string}
          users={users}
        />
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => (
      <ActionCell
        account={row.original}
        onDelete={(id) => {
          const accountsTable = table.options.meta as TableCustomMeta;
          if (accountsTable && accountsTable.onDeleteAccount) {
            accountsTable.onDeleteAccount(id);
          }
        }}
      />
    ),
  },
];

export function AccountsTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // アカウントデータとユーザーデータの取得
  useEffect(() => {
    // TODO: バックエンドのGoのAPIを叩いてデータを取得する予定
    // 現状はモックデータを使用
    setAccounts(mockAccounts);
    setUsers(mockUsers);
  }, []);

  const handleSaveAccount = (updatedAccount: Account) => {
    // 新規アカウントの場合
    if (!updatedAccount.id) {
      const newAccount = {
        ...updatedAccount,
        id: Date.now().toString(),
      };
      setAccounts([...accounts, newAccount]);
      toast.success("アカウントを作成しました");
    } else {
      // 既存アカウントの更新
      const updatedAccounts = accounts.map((acc) =>
        acc.id === updatedAccount.id ? updatedAccount : acc
      );
      setAccounts(updatedAccounts);
      toast.success("アカウントを更新しました");
    }
  };

  const handleDeleteAccount = (id: string) => {
    // アカウントの削除処理
    const filteredAccounts = accounts.filter((acc) => acc.id !== id);
    setAccounts(filteredAccounts);
    toast.success("アカウントを削除しました");
  };

  const table = useReactTable({
    data: accounts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    meta: {
      users, // usersをmetaとして渡す
      onDeleteAccount: handleDeleteAccount, // 削除ハンドラーを渡す
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="検索..."
            className="pl-8"
            value={columnFilters.map((filter) => filter.value).join(" ")}
            onChange={(e) => {
              setColumnFilters([{ id: "appName", value: e.target.value }]);
            }}
          />
        </div>
        <AccountCreationDialog onSave={handleSaveAccount} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  データがありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ページネーションコントロール */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            全 {table.getFilteredRowModel().rows.length} 件中
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}
            -
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}
            件を表示
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            前へ
          </Button>
          {Array.from({ length: table.getPageCount() })
            .map((_, index) => (
              <Button
                key={index}
                variant={
                  table.getState().pagination.pageIndex === index
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => table.setPageIndex(index)}
              >
                {index + 1}
              </Button>
            ))
            .slice(
              Math.max(0, table.getState().pagination.pageIndex - 1),
              Math.min(
                table.getPageCount(),
                table.getState().pagination.pageIndex + 4
              )
            )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            次へ
          </Button>
        </div>
      </div>
    </div>
  );
}
