"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadEpubUseCase } from "@/core/epub-reader/factories/epub-reader.factory";
import type { EpubFile } from "@/shared/types/epub";

export function useUploadEpub() {
  const queryClient = useQueryClient();

  return useMutation<EpubFile, Error, File>({
    mutationFn: (file: File) => uploadEpubUseCase.execute(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epub-library"] });
    },
  });
}
