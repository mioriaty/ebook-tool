"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMetadataUseCase,
  updateMetadataUseCase,
} from "@/core/epub-metadata/factories/epub-metadata.factory";
import type { EpubMetadata } from "@/shared/types/epub";

export function useMetadata(sessionId: string | null) {
  return useQuery({
    queryKey: ["epub-metadata", sessionId],
    queryFn: () => getMetadataUseCase.execute(sessionId!),
    enabled: !!sessionId,
  });
}

export function useUpdateMetadata(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation<EpubMetadata, Error, Partial<EpubMetadata>>({
    mutationFn: (updates) =>
      updateMetadataUseCase.execute(sessionId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["epub-metadata", sessionId],
      });
      queryClient.invalidateQueries({ queryKey: ["epub-file", sessionId] });
    },
  });
}
