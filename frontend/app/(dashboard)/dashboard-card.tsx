import { Button } from "@/components/ui/button";

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBgColor: string;
  children: React.ReactNode;
  count?: number;
  countLabel?: string;
  onManage?: () => void;
}

export default function DashboardCard({
  title,
  description,
  icon,
  iconBgColor,
  children,
  count,
  countLabel,
  onManage,
}: DashboardCardProps) {
  return (
    <div className="p-6 bg-white rounded-lg border shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div
            className={`${iconBgColor} rounded-full p-4 flex items-center justify-center`}
          >
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-gray-600 text-sm">{description}</p>
          </div>
        </div>
        <Button
          className="px-3 py-1 text-sm border rounded-md"
          onClick={onManage}
        >
          管理する
        </Button>
      </div>

      {children}

      {count !== undefined && (
        <div className="flex justify-end">
          <div className="text-right">
            <span className="text-3xl font-bold">{count}</span>
            <span className="text-gray-600 ml-2">{countLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}
