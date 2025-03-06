import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountsTable } from "./accounts-table";
import { AccountsCardView } from "./accounts-card-view";

export default function AccountsPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">アカウント</h1>
      </div>

      <Tabs defaultValue="table">
        <div className="flex justify-between items-center my-4">
          <TabsList>
            <TabsTrigger value="table">テーブル</TabsTrigger>
            <TabsTrigger value="card">カード</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="table">
          <AccountsTable />
        </TabsContent>
        <TabsContent value="card">
          <AccountsCardView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
