"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUploadEpub } from "../hooks/use-upload-epub";
import { useEpubContext } from "@/containers/shared/components/epub-context";
import { toast } from "sonner";

export function EpubUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadEpub();
  const { setCurrentBook } = useEpubContext();

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".epub")) {
        toast.error("Only .epub files are supported");
        return;
      }

      try {
        const result = await uploadMutation.mutateAsync(file);
        setCurrentBook(result);
        toast.success(`"${result.metadata.title}" loaded successfully`);
      } catch {
        toast.error("Failed to upload EPUB file");
      }
    },
    [uploadMutation, setCurrentBook]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
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
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

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
      onClick={handleClick}
    >
      <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".epub"
          className="hidden"
          onChange={handleFileChange}
        />
        {uploadMutation.isPending ? (
          <>
            <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Processing EPUB...</p>
          </>
        ) : (
          <>
            <div className="rounded-full bg-muted p-4">
              {isDragging ? (
                <FileText className="h-8 w-8 text-primary" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                Drop your EPUB file here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports .epub files
              </p>
            </div>
            <Button variant="secondary" size="sm">
              Choose File
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
