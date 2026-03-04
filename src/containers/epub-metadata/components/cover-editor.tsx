"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CoverEditorProps {
  sessionId: string;
}

export function CoverEditor({ sessionId }: CoverEditorProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadCover() {
      try {
        const response = await fetch(
          `/api/epub/${sessionId}/metadata?cover=true`
        );
        const data = await response.json();
        if (data?.data) {
          setCoverUrl(data.data);
        }
      } catch {
        // no cover
      } finally {
        setIsLoading(false);
      }
    }
    loadCover();
  }, [sessionId]);

  const handleCoverUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("cover", file);

        const response = await fetch(`/api/epub/${sessionId}/metadata`, {
          method: "PUT",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");

        const reader = new FileReader();
        reader.onload = () => setCoverUrl(reader.result as string);
        reader.readAsDataURL(file);

        toast.success("Cover image updated");
      } catch {
        toast.error("Failed to update cover image");
      } finally {
        setIsUploading(false);
      }
    },
    [sessionId]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cover Image</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleCoverUpload(file);
            e.target.value = "";
          }}
        />

        <div className="w-full aspect-[2/3] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt="Book cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="h-12 w-12" />
              <span className="text-xs">No cover image</span>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          Change Cover
        </Button>
      </CardContent>
    </Card>
  );
}
