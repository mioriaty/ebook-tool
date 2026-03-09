"use client";

import {
  createContext,
  useContext,
  useState,
  useMemo,
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

const SESSION_STORAGE_KEY = "currentBookSessionId";

export function EpubProvider({ children }: { children: ReactNode }) {
  const [currentBookOverride, setCurrentBookState] = useState<EpubFile | null>(
    null,
  );
  const [savedSessionId, setSavedSessionId] = useState<string | null>(() =>
    typeof window !== "undefined"
      ? sessionStorage.getItem(SESSION_STORAGE_KEY)
      : null,
  );
  const queryClient = useQueryClient();

  const { data: library = [], isLoading: isLibraryLoading } = useQuery<
    EpubFile[]
  >({
    queryKey: ["epub-library"],
    queryFn: () => fetchClient.get<EpubFile[]>("/api/epub/library"),
  });

  // Derive currentBook: prefer explicit override, otherwise restore from sessionStorage
  const currentBook = useMemo<EpubFile | null>(() => {
    if (currentBookOverride) return currentBookOverride;
    if (!savedSessionId || isLibraryLoading) return null;
    return library.find((b) => b.sessionId === savedSessionId) ?? null;
  }, [currentBookOverride, savedSessionId, library, isLibraryLoading]);

  const setCurrentBook = useCallback((book: EpubFile | null) => {
    setCurrentBookState(book);
    if (book) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, book.sessionId);
      setSavedSessionId(book.sessionId);
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setSavedSessionId(null);
    }
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
