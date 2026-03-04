"use client";

import { useQuery } from "@tanstack/react-query";
import { getEpubUseCase } from "@/core/epub-reader/factories/epub-reader.factory";

export function useEpubFile(sessionId: string | null) {
  return useQuery({
    queryKey: ["epub-file", sessionId],
    queryFn: () => getEpubUseCase.execute(sessionId!),
    enabled: !!sessionId,
  });
}
