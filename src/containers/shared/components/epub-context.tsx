"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { EpubFile } from "@/shared/types/epub";

interface EpubContextValue {
  currentBook: EpubFile | null;
  setCurrentBook: (book: EpubFile | null) => void;
  isBookLoaded: boolean;
}

const EpubContext = createContext<EpubContextValue | null>(null);

export function EpubProvider({ children }: { children: ReactNode }) {
  const [currentBook, setCurrentBookState] = useState<EpubFile | null>(null);

  const setCurrentBook = useCallback((book: EpubFile | null) => {
    setCurrentBookState(book);
  }, []);

  return (
    <EpubContext.Provider
      value={{
        currentBook,
        setCurrentBook,
        isBookLoaded: !!currentBook,
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
