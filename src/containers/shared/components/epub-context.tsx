"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
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
  const [currentBook, setCurrentBookState] = useState<EpubFile | null>(null);
  const queryClient = useQueryClient();

  console.log(
    "[EpubProvider] render — currentBook:",
    currentBook?.metadata?.title ?? null,
  );

  const { data: library = [], isLoading: isLibraryLoading } = useQuery<
    EpubFile[]
  >({
    queryKey: ["epub-library"],
    queryFn: () => fetchClient.get<EpubFile[]>("/api/epub/library"),
  });

  // Restore currentBook từ sessionStorage sau khi library load xong
  useEffect(() => {
    console.log(
      "[EpubProvider] useEffect restore — isLibraryLoading:",
      isLibraryLoading,
      "library.length:",
      library.length,
      "currentBook:",
      currentBook?.metadata?.title ?? null,
    );
    if (currentBook || isLibraryLoading || library.length === 0) return;
    const savedId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    console.log("[EpubProvider] sessionStorage savedId:", savedId);
    if (!savedId) return;
    const found = library.find((b) => b.sessionId === savedId);
    console.log(
      "[EpubProvider] found book to restore:",
      found?.metadata?.title ?? null,
    );
    if (found) setCurrentBookState(found);
  }, [library, isLibraryLoading, currentBook]);

  const setCurrentBook = useCallback((book: EpubFile | null) => {
    console.log(
      "[EpubProvider] setCurrentBook:",
      book?.metadata?.title ?? null,
    );
    setCurrentBookState(book);
    if (book) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, book.sessionId);
      console.log("[EpubProvider] sessionStorage set:", book.sessionId);
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      console.log("[EpubProvider] sessionStorage cleared");
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
