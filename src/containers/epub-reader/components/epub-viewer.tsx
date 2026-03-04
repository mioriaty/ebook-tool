"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useEpubContext } from "@/containers/shared/components/epub-context";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Minus, Plus, Loader2 } from "lucide-react";

const ReactReader = dynamic(
  () => import("react-reader").then((mod) => mod.ReactReader),
  { ssr: false }
);

const FONT_SIZES = ["80%", "90%", "100%", "110%", "120%", "140%", "160%"];

export function EpubViewer() {
  const { currentBook } = useEpubContext();
  const [location, setLocation] = useState<string | number>(0);
  const [fontSize, setFontSize] = useState("100%");
  const [epubData, setEpubData] = useState<ArrayBuffer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rendition, setRendition] = useState<{
    prev: () => void;
    next: () => void;
    themes: { fontSize: (size: string) => void };
  } | null>(null);

  useEffect(() => {
    if (!currentBook) {
      setEpubData(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLocation(0);

    fetch(`/api/epub/${currentBook.sessionId}/download`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch EPUB");
        return res.arrayBuffer();
      })
      .then((buffer) => {
        if (!cancelled) setEpubData(buffer);
      })
      .catch(() => {
        if (!cancelled) setEpubData(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentBook?.sessionId]);

  const handleLocationChange = useCallback((loc: string) => {
    setLocation(loc);
  }, []);

  const handleRendition = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (rend: any) => {
      setRendition(rend);
      rend.themes.fontSize(fontSize);
    },
    [fontSize]
  );

  const changeFontSize = useCallback(
    (direction: "up" | "down") => {
      const currentIdx = FONT_SIZES.indexOf(fontSize);
      const newIdx =
        direction === "up"
          ? Math.min(currentIdx + 1, FONT_SIZES.length - 1)
          : Math.max(currentIdx - 1, 0);
      const newSize = FONT_SIZES[newIdx];
      setFontSize(newSize);
      rendition?.themes.fontSize(newSize);
    },
    [fontSize, rendition]
  );

  if (!currentBook) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-muted-foreground">
        Select a book from the library to start reading
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading book...</p>
      </div>
    );
  }

  if (!epubData) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-destructive">
        Failed to load book
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => rendition?.prev()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => rendition?.next()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <h2 className="text-sm font-medium truncate max-w-md">
          {currentBook.metadata.title}
        </h2>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changeFontSize("down")}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Select
            value={fontSize}
            onValueChange={(val) => {
              setFontSize(val);
              rendition?.themes.fontSize(val);
            }}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changeFontSize("up")}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        <ReactReader
          url={epubData}
          location={location}
          locationChanged={handleLocationChange}
          getRendition={handleRendition}
          epubOptions={{
            allowScriptedContent: true,
          }}
        />
      </div>
    </div>
  );
}
