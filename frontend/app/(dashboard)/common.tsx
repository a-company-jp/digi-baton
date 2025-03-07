"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

function ErrorFlashMessage({ message }: { message: string }) {
  return (
    <div className="p-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>エラー</AlertTitle>
        <AlertDescription>
          {message}
        </AlertDescription>
      </Alert>
    </div>
  );
}

function TableTitle({ title }: { title: string }) {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  )
}

function EditDialog({
  resource,
  modal
}: {
  resource: string;
  modal: React.ReactNode;
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{resource}の編集</DialogTitle>
          </DialogHeader>
          <DialogDescription>{resource}情報を編集します。</DialogDescription>
          {modal}
        </DialogContent>
      </Dialog>
    </>
  );
}

function DeleteDialog<T>({
  resource,
  onDelete,
}: {
  resource: string;
  onDelete: () => void;
}) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>アカウント削除の確認</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              「{resource || "このアカウント"}
              」を削除してもよろしいですか？
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              この操作は元に戻せません。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={() => {onDelete();setIsDeleteOpen(false);}}>
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


export { TableTitle, ErrorFlashMessage, EditDialog, DeleteDialog };
