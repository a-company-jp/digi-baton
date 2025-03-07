"use client";

import Image from "next/image";

import { HandlersDeviceResponse } from "@/app/api/generated/schemas";
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
import { getDeviceType } from "./mock-data";
import {
  CopyableCell,
  PasswordCell,
} from "@/components/ui/table";
import { useState } from "react";
import { TablePagination, TableSearch, TableUI } from "../table-common";

// テーブルのカラム定義
const columns: ColumnDef<HandlersDeviceResponse>[] = [
    {
      accessorKey: "deviceType",
      header: "デバイスの種類",
      cell: ({ row }) => {
        const deviceType = row.getValue("deviceType") as number;
        const deviceTypeLabel = getDeviceType(deviceType);
        return deviceTypeLabel ? (
          <CopyableCell value={deviceTypeLabel} label="デバイスの種類" />
        ) : (
          <span className="text-muted-foreground">未設定</span>
        );
      },
    },
    {
      accessorKey: "deviceDescription",
      header: "デバイス情報",
      cell: ({ row }) => {
        const description = row.getValue("deviceDescription") as string;
        return description ? (
          <CopyableCell value={description} label="デバイスの種類" />
        ) : (
          <span className="text-muted-foreground">未設定</span>
        );
      },
    },
    {
      accessorKey: "deviceUsername",
      header: "ユーザ名",
      cell: ({ row }) => {
        const username = row.getValue("deviceUsername") as string;
        return username ? (
          <CopyableCell value={username} label="ユーザ名" />
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


  export function DevicesTable({ devicesData }: { devicesData: HandlersDeviceResponse[] }) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
    const table = useReactTable({
      data: devicesData,
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
          <TableSearch<HandlersDeviceResponse> table={table} key="appName" placeholder="アプリ名で検索" />
        </div>
        <TableUI<HandlersDeviceResponse> table={table} columns={columns} noFoundMessage="アカウントが見つかりませんでした" />
        <TablePagination<HandlersDeviceResponse> table={table} />
      </div>
    );
  }
