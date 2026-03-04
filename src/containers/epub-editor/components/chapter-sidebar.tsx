"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useChapters } from "../hooks/use-chapters";
import type { EpubChapter } from "@/shared/types/epub";

interface ChapterSidebarProps {
  sessionId: string;
  selectedChapter: EpubChapter | null;
  onSelectChapter: (chapter: EpubChapter) => void;
}

export function ChapterSidebar({
  sessionId,
  selectedChapter,
  onSelectChapter,
}: ChapterSidebarProps) {
  const { data: chapters, isLoading } = useChapters(sessionId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!chapters?.length) {
    return (
      <div className="text-center text-muted-foreground py-8 text-sm">
        No chapters found
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="space-y-1 p-2">
        {chapters.map((chapter) => {
          const isActive = selectedChapter?.href === chapter.href;
          return (
            <Button
              key={chapter.id}
              variant={isActive ? "secondary" : "ghost"}
              className="w-full justify-start text-left h-auto py-2 px-3"
              onClick={() => onSelectChapter(chapter)}
            >
              <FileText className="h-4 w-4 mr-2 shrink-0" />
              <span className="truncate text-sm">
                {chapter.title || `Chapter ${chapter.order + 1}`}
              </span>
            </Button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
