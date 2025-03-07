import React from "react";
import { DevicesTable } from "./devices-table";
import { devicesMockData } from "./mock-data";
import { TableTitle } from "../common";

function Devices() {
  return (
    <div>
      <TableTitle title="デバイス" />
      <DevicesTable devicesData={devicesMockData} />
    </div>
  )
}

export default Devices;
