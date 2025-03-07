"use client";

import { Button } from "@/components/ui/button";
import {
  DollarSignIcon,
  FileLockIcon,
  HomeIcon,
  Menu,
  SettingsIcon,
  SmartphoneChargingIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import QueryProvider from "../query_provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { href: "/", icon: HomeIcon, label: "ホーム" },
    { href: "/accounts", icon: UserIcon, label: "アカウント" },
    {
      href: "/subscriptions",
      icon: DollarSignIcon,
      label: "サブスクリプション",
    },
    { href: "/devices", icon: SmartphoneChargingIcon, label: "デバイス" },
    { href: "/disclose", icon: FileLockIcon, label: "相続申請" },
    { href: "/settings", icon: SettingsIcon, label: "設定" },
  ];
  return (
    <QueryProvider>
      <div className="relative min-h-[calc(100dvh-68px)]">
        <div className="relative max-w-7xl mx-auto">
          {/* Mobile header */}
          <div className="lg:hidden fixed top-[60px] left-0 right-0 z-40 flex items-center justify-end bg-gray-50 border-b border-gray-200 p-4">
            <Button
              className="ml-auto -mr-3"
              variant="ghost"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </div>

          <div className="flex flex-1 h-full">
            {/* Sidebar */}
            <aside className="hidden lg:block fixed top-[60px] w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto h-[calc(100vh-60px)]">
              <nav className="p-4">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} passHref>
                    <Button
                      variant={pathname === item.href ? "secondary" : "ghost"}
                      className={`shadow-none my-2 w-full justify-start ${
                        pathname === item.href ? "bg-gray-100" : ""
                      }`}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </nav>
            </aside>

            <aside
              className={`lg:hidden fixed inset-0 z-50 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out bg-gray-50 w-64 overflow-y-auto`}
            >
              <nav className="p-4">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} passHref>
                    <Button
                      variant={pathname === item.href ? "secondary" : "ghost"}
                      className={`shadow-none my-2 w-full justify-start ${
                        pathname === item.href ? "bg-gray-100" : ""
                      }`}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </nav>
            </aside>

            {/* Main content */}
            <main className="flex-1 lg:ml-64 py-4 mt-[69px] px-4 lg:mt-0">
              {children}
            </main>
          </div>
        </div>
      </div>
    </QueryProvider>
  );
}
