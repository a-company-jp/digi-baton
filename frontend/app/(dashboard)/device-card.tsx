"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import DashboardCard from "./dashboard-card";
import { MonitorSmartphoneIcon } from "lucide-react";
import type { HandlersDeviceResponse } from "../api/generated/schemas/handlersDeviceResponse";

const MAX_DISPLAY_DEVICES = 4;

interface Device {
  id: string;
  device_type: string;
  device_username: string;
  device_description: string;
  encoded_password: string;
}

interface DeviceCardProps {
  devices: HandlersDeviceResponse[];
}

// デバイスタイプの数値を文字列に変換する関数
function getDeviceTypeString(typeNumber: number): string {
  switch (typeNumber) {
    case 1:
      return "pc";
    case 2:
      return "phone";
    case 3:
      return "tablet";
    default:
      return "pc";
  }
}

export function DeviceCard({ devices: devicesData }: DeviceCardProps) {
  const router = useRouter();

  // APIのレスポンスを変換
  const devices: Device[] = devicesData.map((device) => ({
    id: device.id?.toString() || "",
    device_type: getDeviceTypeString(device.deviceType || 0),
    device_username: device.deviceUsername || "",
    device_description: device.deviceDescription || "",
    encoded_password: device.encPassword || "",
  }));

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
      {devices.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          <p>デバイスがありません</p>
        </div>
      ) : (
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
      )}
    </DashboardCard>
  );
}
