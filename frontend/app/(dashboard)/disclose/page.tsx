import { getDisclosures } from "@/app/api/generated/disclosures/disclosures";
import { HandlersDisclosureResponse } from "@/app/api/generated/schemas";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth } from "@clerk/nextjs/server";
import { AlertCircle } from "lucide-react";
import React from "react";
import { DisclosuresTable } from "./disclosures-table";

async function Disclosures() {
  const authData = await auth();
  const token = await authData.getToken();

  let isError = false;
  let disclosuresData: HandlersDisclosureResponse[] = [];

  try {
    const response = await getDisclosures({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response && "data" in response && Array.isArray(response.data)) {
      disclosuresData = response.data as HandlersDisclosureResponse[];
    }
  } catch (error) {
    console.error("Error fetching disclosures:", error);
    isError = true;
  }

  // エラー状態の処理
  if (isError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>
            相続申請情報の取得中にエラーが発生しました。
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">相続申請</h1>
      </div>

      <div className="mt-6">
        <DisclosuresTable disclosuresData={disclosuresData} />
      </div>
    </div>
  );
}

export default Disclosures;
