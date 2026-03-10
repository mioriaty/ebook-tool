"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Loader2 } from "lucide-react";
import { useSendToKindle } from "../hooks/use-send-to-kindle";
import { toast } from "sonner";
import type { EpubFile } from "@/shared/types/epub";

interface SendToKindleDialogProps {
  book: EpubFile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendToKindleDialog({
  book,
  open,
  onOpenChange,
}: SendToKindleDialogProps) {
  const [kindleEmail, setKindleEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const sendMutation = useSendToKindle();

  useEffect(() => {
    // Load saved email when dialog opens
    if (open) {
      const savedEmail = localStorage.getItem("ebook-tool-kindle-email");
      if (savedEmail) setKindleEmail(savedEmail);
    }
  }, [open]);

  const handleSend = async () => {
    if (!kindleEmail) {
      toast.error("Vui lòng nhập địa chỉ email Kindle của bạn.");
      return;
    }

    if (
      !kindleEmail.includes("@kindle.com") &&
      !kindleEmail.includes("@free.kindle.com")
    ) {
      toast.error("Email phải có đuôi @kindle.com hoặc @free.kindle.com");
      return;
    }

    try {
      setIsLoading(true);
      // Save for future use
      localStorage.setItem("ebook-tool-kindle-email", kindleEmail);

      await sendMutation.mutateAsync({
        sessionId: book.sessionId,
        kindleEmail: kindleEmail,
      });

      toast.success("Sách đã được gửi đến Kindle của bạn!");
      onOpenChange(false);
    } catch (error: unknown) {
      console.error(error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể gửi sách. Vui lòng kiểm tra lại thiết lập.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gửi sách đến Kindle</DialogTitle>
          <DialogDescription>
            Bạn sắp gửi cuốn{" "}
            <strong>{book.metadata.title || "sách này"}</strong> đến thiết bị
            Kindle.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="kindleEmail">Địa chỉ email Kindle của bạn</Label>
            <Input
              id="kindleEmail"
              placeholder="example@kindle.com"
              value={kindleEmail}
              onChange={(e) => setKindleEmail(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md space-y-2">
            <p className="font-semibold text-foreground">
              💡 Lưu ý quan trọng:
            </p>
            <p>
              Bạn phải thêm email{" "}
              <strong>
                {process.env.NEXT_PUBLIC_SENDER_EMAIL ||
                  "delivery@ebook-tool.com"}
              </strong>{" "}
              vào danh sách <i>Approved Personal Document E-mail List</i> trên
              Amazon Settings của bạn trước khi gửi.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSend} disabled={isLoading || !kindleEmail}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Gửi sách
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
