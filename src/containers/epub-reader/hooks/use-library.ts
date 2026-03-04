"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteBook() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (sessionId: string) => {
      await fetch("/api/epub/library", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to delete book");
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epub-library"] });
    },
  });
}

export function useRefreshLibrary() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["epub-library"] });
}
