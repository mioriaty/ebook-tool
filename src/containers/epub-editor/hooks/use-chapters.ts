"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getChaptersUseCase,
  getEditorChapterContentUseCase,
  updateChapterUseCase,
} from "@/core/epub-editor/factories/epub-editor.factory";
import { fetchClient } from "@/libs/api/fetch-client";
import type { EpubEditableFile } from "@/shared/types/epub";

export function useChapters(sessionId: string | null) {
  return useQuery({
    queryKey: ["epub-chapters", sessionId],
    queryFn: () => getChaptersUseCase.execute(sessionId!),
    enabled: !!sessionId,
  });
}

export function useEditableFiles(sessionId: string | null) {
  return useQuery({
    queryKey: ["epub-editable-files", sessionId],
    queryFn: () =>
      fetchClient.get<EpubEditableFile[]>(`/api/epub/${sessionId}/files`),
    enabled: !!sessionId,
  });
}

export function useChapterContent(
  sessionId: string | null,
  chapterHref: string | null
) {
  return useQuery({
    queryKey: ["epub-chapter-content", sessionId, chapterHref],
    queryFn: () =>
      getEditorChapterContentUseCase.execute(sessionId!, chapterHref!),
    enabled: !!sessionId && !!chapterHref,
  });
}

export function useUpdateChapter(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chapterHref,
      content,
    }: {
      chapterHref: string;
      content: string;
    }) => updateChapterUseCase.execute(sessionId, chapterHref, content),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "epub-chapter-content",
          sessionId,
          variables.chapterHref,
        ],
      });
    },
  });
}
