import React from "react";
import { SubscriptionsTable } from "./subscriptions-table";
import { subscriptions } from "./mock-data";
import { TableTitle } from "../common";

function Subscriptions() {
  return (
    <div>
      <TableTitle title="サブスクリプション" />
      <SubscriptionsTable subscriptionsData={subscriptions} />
    </div>
  )
}

export default Subscriptions;
