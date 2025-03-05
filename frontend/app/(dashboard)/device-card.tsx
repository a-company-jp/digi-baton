"use client";
import { useEffect, useState } from "react";
import DashboardCard from "./dashboard-card";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MonitorSmartphoneIcon } from "lucide-react";

const MAX_DISPLAY_DEVICES = 4;

interface Device {
  id: string;
  device_type: string;
  device_username: string;
  device_description: string;
  encoded_password: string;
}

export function DeviceCard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const router = useRouter();

  // 将来的にはここでAPIを呼び出し
  useEffect(() => {
    // call API

    // mock data
    setDevices([
      {
        id: "1",
        device_type: "pc",
        device_username: "Hiroki's MacBook Pro",
        device_description: "MacBook Pro 14インチ 2023",
        encoded_password: "encodedPassword",
      },
      {
        id: "2",
        device_type: "tablet",
        device_username: "Hiroki's iPad",
        device_description: "iPad Air 第4世代",
        encoded_password: "encodedPassword",
      },
      {
        id: "3",
        device_type: "phone",
        device_username: "Hiroki's iPhone",
        device_description: "iPhone 15 Pro Max",
        encoded_password: "encodedPassword",
      },
      {
        id: "4",
        device_type: "pc",
        device_username: "Hiroki's Surface Laptop",
        device_description: "Surface Laptop 4",
        encoded_password: "encodedPassword",
      },
    ]);
  }, []);

  const handleManage = () => {
    return router.push("/devices");
  };

  return (
    <DashboardCard
      title="デバイス"
      description="お持ちのデバイスを登録して、もしものときに備えましょう。"
      icon={<MonitorSmartphoneIcon color="white" />}
      iconBgColor="bg-yellow-400"
      count={devices.length}
      countLabel="デバイス登録済み"
      onManage={handleManage}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {devices.slice(0, MAX_DISPLAY_DEVICES).map((device) => (
          <div
            key={device.id}
            className="border rounded-md p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-5">
              <Image
                src={`/icons/${device.device_type}.png`}
                alt={device.device_type}
                width={96}
                height={96}
                className="object-contain"
              />
              <div>
                <div className="text-xl font-semibold">
                  {device.device_username}
                </div>
                <div>
                  <span className="text-sm font-normal text-gray-600">
                    {device.device_description}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
