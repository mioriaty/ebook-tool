"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { EpubFile } from "@/shared/types/epub";
import { fetchClient } from "@/libs/api/fetch-client";

interface EpubContextValue {
  currentBook: EpubFile | null;
  setCurrentBook: (book: EpubFile | null) => void;
  isBookLoaded: boolean;
  library: EpubFile[];
  isLibraryLoading: boolean;
  refreshLibrary: () => void;
}

const EpubContext = createContext<EpubContextValue | null>(null);

export function EpubProvider({ children }: { children: ReactNode }) {
  const [currentBook, setCurrentBookState] = useState<EpubFile | null>(null);
  const queryClient = useQueryClient();

  const { data: library = [], isLoading: isLibraryLoading } = useQuery<
    EpubFile[]
  >({
    queryKey: ["epub-library"],
    queryFn: () => fetchClient.get<EpubFile[]>("/api/epub/library"),
  });

  const setCurrentBook = useCallback((book: EpubFile | null) => {
    setCurrentBookState(book);
  }, []);

  const refreshLibrary = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["epub-library"] });
  }, [queryClient]);

  return (
    <EpubContext.Provider
      value={{
        currentBook,
        setCurrentBook,
        isBookLoaded: !!currentBook,
        library,
        isLibraryLoading,
        refreshLibrary,
      }}
    >
      {children}
    </EpubContext.Provider>
  );
}

export function useEpubContext() {
  const context = useContext(EpubContext);
  if (!context) {
    throw new Error("useEpubContext must be used within an EpubProvider");
  }
  return context;
}
