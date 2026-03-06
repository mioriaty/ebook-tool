"use client";

import { useMutation } from "@tanstack/react-query";
import { convertEpubUseCase } from "@/core/epub-converter/factories/epub-converter.factory";

export function useConvertToTxt(sessionId: string, bookTitle: string) {
  return useMutation({
    mutationFn: () => convertEpubUseCase.execute(sessionId),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Sanitize the title for use as a filename
      const safeName =
        bookTitle.replace(/[^a-z0-9\-_ ]/gi, "").trim() || "book";
      a.download = `${safeName}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}
