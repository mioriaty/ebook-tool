"use client";

import { useMutation } from "@tanstack/react-query";
import { convertEpubUseCase } from "@/core/epub-converter/factories/epub-converter.factory";
import type { ConvertOptions } from "@/shared/types/epub";

export function useConvertEpub(sessionId: string) {
  return useMutation({
    mutationFn: (options: ConvertOptions) =>
      convertEpubUseCase.execute(sessionId, options),
    onSuccess: (blob, variables) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `book.${variables.outputFormat}`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}
