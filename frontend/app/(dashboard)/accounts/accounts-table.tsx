"use client";

import { useState } from "react";
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
import { HandlersAccountResponse } from "@/app/api/generated/schemas/handlersAccountResponse";
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
  account: HandlersAccountResponse;
  onDelete: (id: number) => void;
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
            onSave={(updatedAccount) => {
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
            <p>
              「{account.appName || "このアカウント"}
              」を削除してもよろしいですか？
            </p>
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
                onDelete(account.id || 0);
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

// テーブルのカラム定義
const columns: ColumnDef<HandlersAccountResponse>[] = [
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
      const appName = row.getValue("appName") as string;
      const appIconUrl = row.original.appIconUrl as string | undefined;

      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center">
            {appIconUrl ? (
              <Image src={appIconUrl} alt={appName} width={20} height={20} />
            ) : (
              <div className="w-8 h-8 rounded-md bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                {appName?.charAt(0) || "?"}
              </div>
            )}
          </div>
          <span>{appName || "不明"}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "メールアドレス",
    cell: ({ row }) => {
      const email = row.getValue("email") as string | undefined;
      return email ? (
        <CopyableCell value={email} label="メールアドレス" />
      ) : (
        <span className="text-muted-foreground">未設定</span>
      );
    },
  },
  {
    accessorKey: "encPassword",
    header: "パスワード",
    cell: () => {
      // 実際のアプリケーションでは暗号化されたパスワードを復号化するロジックが必要
      // ダミーパスワードを使用
      return <PasswordCell value="********" />;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ActionCell
        account={row.original}
        onDelete={(id) => {
          // 削除処理
          console.log(`ID: ${id}のアカウントを削除`);
        }}
      />
    ),
  },
];

interface AccountsTableProps {
  accountsData: HandlersAccountResponse[];
}

export function AccountsTable({ accountsData }: AccountsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data: accountsData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between pb-4">
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="アプリ名、メールアドレスで検索..."
            value={
              (table.getColumn("appName")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("appName")?.setFilterValue(event.target.value)
            }
            className="w-80 pl-8"
          />
        </div>
        <AccountCreationDialog
          onSave={(newAccount) => {
            // ここにアカウント作成処理を実装
            console.log("新規アカウント:", newAccount);
          }}
        />
      </div>

      <div className="rounded-md border bg-card">
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
                  登録されたアカウントがありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          前へ
        </Button>
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
  );
}
