"use client";

import { useState, useCallback } from "react";
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
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";

const ReactReader = dynamic(
  () => import("react-reader").then((mod) => mod.ReactReader),
  { ssr: false }
);

const FONT_SIZES = ["80%", "90%", "100%", "110%", "120%", "140%", "160%"];

export function EpubViewer() {
  const { currentBook } = useEpubContext();
  const [location, setLocation] = useState<string | number>(0);
  const [fontSize, setFontSize] = useState("100%");
  const [rendition, setRendition] = useState<{
    prev: () => void;
    next: () => void;
    themes: { fontSize: (size: string) => void };
  } | null>(null);

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
        Upload an EPUB file to start reading
      </div>
    );
  }

  const epubUrl = `/api/epub/${currentBook.sessionId}/download`;

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
          <Select value={fontSize} onValueChange={(val) => {
            setFontSize(val);
            rendition?.themes.fontSize(val);
          }}>
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
          url={epubUrl}
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
