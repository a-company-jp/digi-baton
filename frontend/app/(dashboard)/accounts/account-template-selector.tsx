"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { AccountTemplate } from "./mock-data";
import { User } from "lucide-react";

interface AccountTemplateSelectorProps {
  templates: AccountTemplate[];
  onSelect: (template?: AccountTemplate) => void;
}

export function AccountTemplateSelector({
  templates,
  onSelect,
}: AccountTemplateSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-4">
        <div className="h-px bg-gray-300 flex-grow"></div>
        <h3 className="text-sm font-semibold text-center text-gray-500">
          テンプレートから選択
        </h3>
        <div className="h-px bg-gray-300 flex-grow"></div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {templates.map((template) => (
          <Button
            key={template.id}
            variant="outline"
            className="flex flex-col items-center justify-center h-24"
            onClick={() => onSelect(template)}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              {template.appIconUrl ? (
                <Image
                  src={template.appIconUrl}
                  alt={template.appName}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs">
                  {template.appName.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-xs">{template.appName}</span>
          </Button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 mt-8">
        <div className="h-px bg-gray-300 flex-grow"></div>
        <h3 className="text-sm font-semibold text-center text-gray-500">
          カスタム作成
        </h3>
        <div className="h-px bg-gray-300 flex-grow"></div>
      </div>

      <div className="flex justify-center w-full">
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center h-20 w-full p-2"
          onClick={() => onSelect(undefined)}
        >
          <User className="h-12 w-12" />
          <span className="text-sm">カスタムアカウント</span>
        </Button>
      </div>
    </div>
  );
}
