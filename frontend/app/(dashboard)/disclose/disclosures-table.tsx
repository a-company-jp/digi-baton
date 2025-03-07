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
  SearchIcon,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  HandlersDisclosureResponse,
  HandlersReceiverResponse,
} from "@/app/api/generated/schemas";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import { getReceivers } from "@/app/api/generated/receivers/receivers";

interface DisclosuresTableProps {
  disclosuresData: HandlersDisclosureResponse[];
}

export function DisclosuresTable({ disclosuresData }: DisclosuresTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [receivers, setReceivers] = useState<HandlersReceiverResponse[]>([]);
  const { getToken } = useAuth();

  // 相続受取人（receivers）データを取得
  useEffect(() => {
    const fetchReceivers = async () => {
      try {
        const token = await getToken();
        const response = await getReceivers({
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.data;
        if (data && Array.isArray(data)) {
          setReceivers(data);
        }
      } catch (error) {
        console.error("Error fetching receivers:", error);
      }
    };

    fetchReceivers();
  }, [getToken]);

  // 受取人（receiver）情報を表示するコンポーネント
  const ReceiverDisplay = ({ userId }: { userId: string }) => {
    const receiver = receivers.find(
      (r: HandlersReceiverResponse) => r.userId === userId
    );

    if (!receiver) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="h-4 w-4 text-gray-500" />
          </div>
          <span className="text-muted-foreground">不明なユーザー</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
          {receiver.iconUrl ? (
            <Image
              src={receiver.iconUrl}
              alt={receiver.name || ""}
              width={24}
              height={24}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
              {receiver.name?.charAt(0) || "?"}
            </div>
          )}
        </div>
        <span>{receiver.name || "不明"}</span>
      </div>
    );
  };

  // 相続申請情報の状態を表示するコンポーネント
  const StatusBadge = ({
    disclosure,
  }: {
    disclosure: HandlersDisclosureResponse;
  }) => {
    if (disclosure.disclosed) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
          <CheckCircle className="h-3.5 w-3.5 mr-1" />
          開示済み
        </Badge>
      );
    } else if (disclosure.inProgress) {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
          <Clock className="h-3.5 w-3.5 mr-1" />
          処理中
        </Badge>
      );
    } else if (disclosure.preventedBy) {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
          <XCircle className="h-3.5 w-3.5 mr-1" />
          拒否
        </Badge>
      );
    } else {
      // 申請中状態
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
          <AlertCircle className="h-3.5 w-3.5 mr-1" />
          申請中
        </Badge>
      );
    }
  };

  // 日付をフォーマットする関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const columns: ColumnDef<HandlersDisclosureResponse>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <span>{row.getValue("id")}</span>,
    },
    {
      accessorKey: "passerID",
      header: "被相続人",
      cell: ({ row }) => {
        const passerID = row.getValue("passerID") as string;
        return <ReceiverDisplay userId={passerID} />;
      },
    },
    {
      accessorKey: "issuedTime",
      header: "申請日時",
      cell: ({ row }) => {
        const issuedTime = row.getValue("issuedTime") as string;
        return <span>{formatDate(issuedTime)}</span>;
      },
    },
    {
      accessorKey: "deadline",
      header: "期限",
      cell: ({ row }) => {
        const deadline = row.getValue("deadline") as string;
        return <span>{formatDate(deadline)}</span>;
      },
    },
    {
      id: "status",
      header: "状態",
      cell: ({ row }) => <StatusBadge disclosure={row.original} />,
    },
  ];

  const table = useReactTable({
    data: disclosuresData,
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
            placeholder="被相続人名で検索..."
            value={
              (table.getColumn("passerID")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("passerID")?.setFilterValue(event.target.value)
            }
            className="w-80 pl-8"
          />
        </div>
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
                  相続申請情報が見つかりませんでした
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
