"use client";

import { useState, useRef } from "react";
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
import { Send, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useSendToKindle } from "../hooks/use-send-to-kindle";
import { toast } from "sonner";
import type { EpubFile } from "@/shared/types/epub";

interface BulkSendToKindleDialogProps {
  books: EpubFile[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

type SendStatus = "pending" | "sending" | "success" | "error";

export function BulkSendToKindleDialog({
  books,
  open,
  onOpenChange,
  onComplete,
}: BulkSendToKindleDialogProps) {
  const [kindleEmail, setKindleEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, SendStatus>>({});
  const sendMutation = useSendToKindle();
  const abortControllerRef = useRef<AbortController | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);

  // Adjust state while rendering when the dialog opens
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      if (typeof window !== "undefined") {
        const savedEmail = localStorage.getItem("ebook-tool-kindle-email");
        if (savedEmail && !kindleEmail) setKindleEmail(savedEmail);
      }

      const initialStatuses: Record<string, SendStatus> = {};
      books.forEach((book) => {
        initialStatuses[book.sessionId] = "pending";
      });
      setStatuses(initialStatuses);
      setIsProcessing(false);
    }
  }

  const handleSendAll = async () => {
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

    setIsProcessing(true);
    localStorage.setItem("ebook-tool-kindle-email", kindleEmail);

    abortControllerRef.current = new AbortController();

    let successCount = 0;
    let errorCount = 0;

    for (const book of books) {
      if (abortControllerRef.current.signal.aborted) {
        break; // Stop if user closed dialog
      }

      // Skip already successful ones if we retry
      if (statuses[book.sessionId] === "success") continue;

      setStatuses((prev) => ({ ...prev, [book.sessionId]: "sending" }));

      try {
        await sendMutation.mutateAsync({
          sessionId: book.sessionId,
          kindleEmail: kindleEmail,
        });
        setStatuses((prev) => ({ ...prev, [book.sessionId]: "success" }));
        successCount++;
      } catch (error) {
        setStatuses((prev) => ({ ...prev, [book.sessionId]: "error" }));
        errorCount++;
        console.error(`Failed to send ${book.metadata.title}:`, error);
      }

      // Add a small delay between requests to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsProcessing(false);

    if (!abortControllerRef.current.signal.aborted) {
      if (errorCount === 0 && successCount > 0) {
        toast.success(`Đã gửi thành công ${successCount} sách!`);
        onComplete?.();
      } else if (successCount > 0 && errorCount > 0) {
        toast.warning(
          `Hoàn tất, nhưng có ${errorCount} sách bị lỗi trong quá trình gửi.`
        );
        onComplete?.();
      } else if (successCount === 0 && errorCount > 0) {
        toast.error(`Thất bại tất cả ${errorCount} sách.`);
      }
    }
  };

  const handleClose = () => {
    if (isProcessing) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
    setIsProcessing(false);
    onOpenChange(false);
  };

  const getStatusIcon = (status: SendStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "sending":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const allDone =
    !Object.values(statuses).includes("pending") &&
    !Object.values(statuses).includes("sending");

  return (
    <Dialog
      open={open}
      onOpenChange={(openVal) => {
        // Prevent clicking outside to close while sending
        if (!openVal && isProcessing) return;
        handleClose();
      }}
    >
      <DialogContent
        className="sm:max-w-125"
        onInteractOutside={(e) => {
          if (isProcessing) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isProcessing) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Gửi sách đến Kindle ({books.length} cuốn)</DialogTitle>
          <DialogDescription>
            Sách sẽ được gửi lần lượt vào hàng đợi để tránh lỗi quá tải. Không
            đóng cửa sổ này nếu quá trình gửi chưa hoàn tất.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bulkKindleEmail">
              Địa chỉ email Kindle của bạn
            </Label>
            <Input
              id="bulkKindleEmail"
              placeholder="example@kindle.com"
              value={kindleEmail}
              onChange={(e) => setKindleEmail(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-2">
            <Label>Tiến trình gửi</Label>
            <div className="border rounded-md overflow-hidden max-h-62.5 overflow-y-auto">
              <div className="divide-y">
                {books.map((book) => {
                  const status = statuses[book.sessionId] || "pending";
                  return (
                    <div
                      key={book.sessionId}
                      className="flex items-center justify-between p-3 text-sm"
                    >
                      <span className="truncate pr-4 font-medium">
                        {book.metadata.title || "Untitled"}
                      </span>
                      <div className="shrink-0 flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span className="capitalize text-xs text-muted-foreground w-16 text-right">
                          {status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
              vào danh sách <i>Approved Personal Document E-mail List</i>.
            </p>
            <p>Các bước thực hiện:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                Truy cập vào <strong>Manage Your Content and Devices</strong>.
              </li>
              <li>
                Trong mục <strong>Preferences</strong>, cuộn xuống đến{" "}
                <strong>Personal Document Settings</strong>.
              </li>
              <li>
                Chọn <strong>Approved Personal Document Email List</strong> và
                kiểm tra xem đã có địa chỉ email của bạn chưa. Nếu không thấy
                địa chỉ email của bạn, chọn{" "}
                <strong>Add a new e-mail address</strong>.
              </li>
              <li>
                Nhập địa chỉ email bạn muốn thêm, đảm bảo địa chỉ đầy đủ và hợp
                lệ, sau đó chọn <strong>Add Address</strong>.
              </li>
            </ol>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing && !allDone}
          >
            {isProcessing && !allDone ? "Đang xử lý..." : "Đóng"}
          </Button>
          {!allDone && (
            <Button
              onClick={handleSendAll}
              disabled={isProcessing || !kindleEmail}
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isProcessing ? "Đang gửi..." : "Bắt đầu gửi"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
