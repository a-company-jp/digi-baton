import { useState } from "react";
import { toast } from "sonner";

export const useCopyClipboard = (value: string, label: string) => {
    const [copied, setCopied] = useState(false);
  
    const copyToClipboard = () => {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast("コピーしました", {
        description: `${label}をクリップボードにコピーしました。`,
        duration: 2000,
      });
    };
  
    return { copied, copyToClipboard };
}
