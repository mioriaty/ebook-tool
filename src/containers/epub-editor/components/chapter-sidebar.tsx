"use client";

import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileText, FileCode, File, Loader2 } from "lucide-react";
import { useEditableFiles } from "../hooks/use-chapters";
import type { EpubEditableFile } from "@/shared/types/epub";

interface ChapterSidebarProps {
  sessionId: string;
  selectedFile: EpubEditableFile | null;
  onSelectFile: (file: EpubEditableFile) => void;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: typeof FileText }
> = {
  xhtml: { label: "Text", icon: FileText },
  css: { label: "Styles", icon: FileCode },
  other: { label: "Other", icon: File },
};

export function ChapterSidebar({
  sessionId,
  selectedFile,
  onSelectFile,
}: ChapterSidebarProps) {
  const { data: files, isLoading } = useEditableFiles(sessionId);

  const grouped = useMemo(() => {
    if (!files) return {};
    return files.reduce<Record<string, EpubEditableFile[]>>((acc, file) => {
      const cat = file.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(file);
      return acc;
    }, {});
  }, [files]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!files?.length) {
    return (
      <div className="text-center text-muted-foreground py-8 text-sm">
        No editable files found
      </div>
    );
  }

  const categories = ["xhtml", "css", "other"].filter((cat) => grouped[cat]);

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-3">
        {categories.map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const Icon = config.icon;
          return (
            <div key={cat}>
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {config.label}
              </div>
              <div className="space-y-0.5 mt-1">
                {grouped[cat].map((file) => {
                  const isActive = selectedFile?.href === file.href;
                  return (
                    <Button
                      key={file.id}
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-start text-left h-auto py-1.5 px-3"
                      onClick={() => onSelectFile(file)}
                    >
                      <Icon className="h-3.5 w-3.5 mr-2 shrink-0" />
                      <span className="truncate text-xs">{file.title}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
