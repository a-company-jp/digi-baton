"use client";
import { HandlersSubscriptionResponse } from "@/app/api/generated/schemas";
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
  CopyableCell,
  PasswordCell,
} from "@/components/ui/table";
import { useState } from "react";
import { TablePagination, TableSearch, TableUI } from "../table-common";

// テーブルのカラム定義
const columns: ColumnDef<HandlersSubscriptionResponse>[] = [
    {
      accessorKey: "serviceName",
      header: "デバイスの種類",
      cell: ({ row }) => {
        const serviceName = row.getValue("serviceName") as string;
        return serviceName ? (
          <CopyableCell value={serviceName} label="デバイスの種類" />
        ) : (
          <span className="text-muted-foreground">未設定</span>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "値段",
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number;
        const yen = `¥${amount.toLocaleString()}`;
        return yen ? (
          <CopyableCell value={yen} label="デバイスの種類" />
        ) : (
          <span className="text-muted-foreground">未設定</span>
        );
      },
    },
    {
      accessorKey: "email",
      header: "ユーザ名",
      cell: ({ row }) => {
        const email = row.getValue("email") as string;
        return email ? (
          <CopyableCell value={email} label="ユーザ名" />
        ) : (
          <span className="text-muted-foreground">未設定</span>
        );
      },
    },
    {
      accessorKey: "encPassword",
      header: "パスワード",
      cell: () => {
        return <PasswordCell value="********" />;
      },
    },
  ];


  export function SubscriptionsTable({ subscriptionsData }: { subscriptionsData: HandlersSubscriptionResponse[] }) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
    const table = useReactTable({
      data: subscriptionsData,
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
      <div className="mt-6">
        <div className="flex items-center justify-between pb-4">
          <TableSearch<HandlersSubscriptionResponse> table={table} key="appName" placeholder="アプリ名で検索" />
        </div>
        <TableUI<HandlersSubscriptionResponse> table={table} columns={columns} noFoundMessage="アカウントが見つかりませんでした" />
        <TablePagination<HandlersSubscriptionResponse> table={table} />
      </div>
    );
  }
