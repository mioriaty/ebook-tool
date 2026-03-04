"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUploadEpub } from "../hooks/use-upload-epub";
import { toast } from "sonner";

export function EpubUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadEpub();

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const epubFiles = Array.from(files).filter((f) =>
        f.name.endsWith(".epub")
      );

      if (epubFiles.length === 0) {
        toast.error("No .epub files found");
        return;
      }

      const skipped = files.length - epubFiles.length;
      if (skipped > 0) {
        toast.warning(`Skipped ${skipped} non-EPUB file(s)`);
      }

      setUploadProgress({ current: 0, total: epubFiles.length });

      let successCount = 0;
      for (let i = 0; i < epubFiles.length; i++) {
        setUploadProgress({ current: i + 1, total: epubFiles.length });
        try {
          const result = await uploadMutation.mutateAsync(epubFiles[i]);
          successCount++;
          if (epubFiles.length === 1) {
            toast.success(`"${result.metadata.title}" added to library`);
          }
        } catch {
          toast.error(`Failed to upload "${epubFiles[i].name}"`);
        }
      }

      if (epubFiles.length > 1 && successCount > 0) {
        toast.success(`${successCount} book(s) added to library`);
      }

      setUploadProgress(null);
    },
    [uploadMutation]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
      e.target.value = "";
    },
    [handleFiles]
  );

  const isUploading = uploadProgress !== null;

  return (
    <Card
      className={`border-2 border-dashed transition-colors cursor-pointer ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={isUploading ? undefined : handleClick}
    >
      <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".epub"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        {isUploading ? (
          <>
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">
              Uploading {uploadProgress.current} of {uploadProgress.total}...
            </p>
            <Progress
              value={
                (uploadProgress.current / uploadProgress.total) * 100
              }
              className="w-48"
            />
          </>
        ) : (
          <>
            <div className="rounded-full bg-muted p-3">
              {isDragging ? (
                <FileText className="h-6 w-6 text-primary" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                Drop EPUB files here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports multiple .epub files
              </p>
            </div>
            <Button variant="secondary" size="sm">
              Choose Files
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
