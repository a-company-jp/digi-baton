import React from "react";
import { DisclosuresTable } from "./disclosures-table";

function Disclosures() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">相続申請</h1>
      </div>

      <div className="mt-6">
        <DisclosuresTable />
      </div>
    </div>
  );
}

export default Disclosures;
