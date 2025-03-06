"use client";

import { useState } from "react";
import { LayoutGrid, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountsTable } from "./accounts-table";
import { AccountsCardView } from "./accounts-card-view";

export default function AccountsPage() {
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">アカウント</h1>
      </div>

      <div className="flex justify-between items-center my-4">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("table")}
            title="テーブル表示"
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("card")}
            title="カード表示"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "table" ? <AccountsTable /> : <AccountsCardView />}
    </div>
  );
}
