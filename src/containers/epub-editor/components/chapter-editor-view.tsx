"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useEpubContext } from "@/containers/shared/components/epub-context";
import { ChapterSidebar } from "./chapter-sidebar";
import { XhtmlPreview } from "./xhtml-preview";
import { useChapterContent, useUpdateChapter } from "../hooks/use-chapters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Save,
  Download,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import type { EpubEditableFile } from "@/shared/types/epub";

const XhtmlCodeEditor = dynamic(
  () =>
    import("./xhtml-code-editor").then((mod) => ({
      default: mod.XhtmlCodeEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

export function ChapterEditorView() {
  const { currentBook } = useEpubContext();
  const [selectedFile, setSelectedFile] = useState<EpubEditableFile | null>(
    null
  );
  const [editedContent, setEditedContent] = useState<string>("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);

  const sessionId = currentBook?.sessionId || "";

  const { data: fileContent, isLoading: isLoadingContent } =
    useChapterContent(sessionId || null, selectedFile?.href || null);

  const updateChapter = useUpdateChapter(sessionId);

  const handleSave = useCallback(async () => {
    if (!selectedFile || !editedContent) return;

    try {
      await updateChapter.mutateAsync({
        chapterHref: selectedFile.href,
        content: editedContent,
      });
      toast.success("File saved successfully");
    } catch {
      toast.error("Failed to save file");
    }
  }, [selectedFile, editedContent, updateChapter]);

  const handleDownload = () => {
    if (!currentBook) return;
    const a = document.createElement("a");
    a.href = `/api/epub/${currentBook.sessionId}/download?download=true`;
    a.download = `${currentBook.metadata.title || "book"}.epub`;
    a.click();
  };

  const isXhtml = selectedFile?.category === "xhtml";
  const showPreview = isPreviewOpen && isXhtml;
  const editorLanguage = selectedFile?.category === "css" ? "css" : "html";

  if (!currentBook) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Upload a book first to edit its files.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between pb-3">
        <div>
          <h1 className="text-2xl font-bold">EPUB Editor</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {selectedFile
              ? selectedFile.title
              : "Select a file to edit"}
          </p>
        </div>
        <div className="flex gap-2">
          {isXhtml && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                >
                  {isPreviewOpen ? (
                    <PanelRightClose className="h-4 w-4" />
                  ) : (
                    <PanelRightOpen className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isPreviewOpen ? "Hide Preview" : "Show Preview"}
              </TooltipContent>
            </Tooltip>
          )}
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download EPUB
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedFile || updateChapter.isPending}
          >
            {updateChapter.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-3 min-h-0">
        <Card className="w-56 shrink-0 flex flex-col">
          <CardHeader className="py-3 px-3">
            <CardTitle className="text-sm">Files</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
            <ChapterSidebar
              sessionId={sessionId}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
            />
          </CardContent>
        </Card>

        <div className="flex-1 min-w-0">
          {!selectedFile ? (
            <Card className="h-full">
              <CardContent className="flex items-center justify-center h-full text-muted-foreground">
                Select a file from the sidebar to start editing
              </CardContent>
            </Card>
          ) : isLoadingContent ? (
            <Card className="h-full">
              <CardContent className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : showPreview ? (
            <ResizablePanelGroup
              orientation="horizontal"
              className="h-full rounded-lg"
            >
              <ResizablePanel defaultSize="60%">
                <XhtmlCodeEditor
                  content={fileContent || ""}
                  onChange={setEditedContent}
                  language={editorLanguage}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="40%">
                <XhtmlPreview
                  content={editedContent || fileContent || ""}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <XhtmlCodeEditor
              content={fileContent || ""}
              onChange={setEditedContent}
              language={editorLanguage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
