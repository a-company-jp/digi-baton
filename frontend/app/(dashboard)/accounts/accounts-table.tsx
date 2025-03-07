"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CopyableCell,
  PasswordCell,
} from "@/components/ui/table";
import {
  ColumnDef,
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
  DialogDescription,
} from "@/components/ui/dialog";
import { AccountEditModal } from "./account-edit-modal";
import { AccountCreationDialog } from "./account-creation-dialog";
import { TablePagination, TableSearch, TableUI } from "../table-common";

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

  const onSave = (updatedAccount: HandlersAccountResponse) => {
    // 実際のアプリケーションではここでデータ更新処理を行う
    console.log("アカウント更新:", updatedAccount);
    setIsEditOpen(false);
  }

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
          <DialogDescription>アカウント情報を編集します。</DialogDescription>
          <AccountEditModal
            account={account}
            onSave={onSave}
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
        <TableSearch<HandlersAccountResponse> table={table} key="appName" placeholder="アプリ名で検索" />
        <AccountCreationDialog
          onSave={(newAccount) => {
            // ここにアカウント作成処理を実装
            console.log("新規アカウント:", newAccount);
          }}
        />
      </div>
      <TableUI<HandlersAccountResponse> table={table} columns={columns} noFoundMessage="アカウントが見つかりませんでした" />
      <TablePagination<HandlersAccountResponse> table={table} />
    </div>
  );
}
