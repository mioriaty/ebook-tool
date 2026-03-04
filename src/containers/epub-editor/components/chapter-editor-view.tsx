"use client";

import { useState, useCallback } from "react";
import { useEpubContext } from "@/containers/shared/components/epub-context";
import { ChapterSidebar } from "./chapter-sidebar";
import { TiptapEditor } from "./tiptap-editor";
import { useChapterContent, useUpdateChapter } from "../hooks/use-chapters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { EpubChapter } from "@/shared/types/epub";

export function ChapterEditorView() {
  const { currentBook } = useEpubContext();
  const [selectedChapter, setSelectedChapter] = useState<EpubChapter | null>(
    null
  );
  const [editedContent, setEditedContent] = useState<string>("");

  const sessionId = currentBook?.sessionId || "";

  const { data: chapterContent, isLoading: isLoadingContent } =
    useChapterContent(
      sessionId || null,
      selectedChapter?.href || null
    );

  const updateChapter = useUpdateChapter(sessionId);

  const handleSave = useCallback(async () => {
    if (!selectedChapter || !editedContent) return;

    try {
      await updateChapter.mutateAsync({
        chapterHref: selectedChapter.href,
        content: editedContent,
      });
      toast.success("Chapter saved successfully");
    } catch {
      toast.error("Failed to save chapter");
    }
  }, [selectedChapter, editedContent, updateChapter]);

  const handleDownload = () => {
    if (!currentBook) return;
    const a = document.createElement("a");
    a.href = `/api/epub/${currentBook.sessionId}/download`;
    a.download = `${currentBook.metadata.title || "book"}.epub`;
    a.click();
  };

  if (!currentBook) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Upload a book first to edit its chapters.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chapter Editor</h1>
          <p className="text-muted-foreground mt-1">
            Select a chapter and edit its content
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download EPUB
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedChapter || updateChapter.isPending}
          >
            {updateChapter.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Chapter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Chapters</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ChapterSidebar
              sessionId={sessionId}
              selectedChapter={selectedChapter}
              onSelectChapter={setSelectedChapter}
            />
          </CardContent>
        </Card>

        <div className="md:col-span-3">
          {!selectedChapter ? (
            <Card>
              <CardContent className="flex items-center justify-center py-20 text-muted-foreground">
                Select a chapter from the sidebar to start editing
              </CardContent>
            </Card>
          ) : isLoadingContent ? (
            <Card>
              <CardContent className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : (
            <TiptapEditor
              content={chapterContent || ""}
              onChange={setEditedContent}
            />
          )}
        </div>
      </div>
    </div>
  );
}
