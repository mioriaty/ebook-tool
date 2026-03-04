"use client";

import { useEffect, useState } from "react";
import { useEpubContext } from "@/containers/shared/components/epub-context";
import { useUpdateMetadata } from "../hooks/use-metadata";
import { CoverEditor } from "./cover-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Save, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { EpubMetadata } from "@/shared/types/epub";

export function MetadataEditor() {
  const { currentBook, setCurrentBook } = useEpubContext();
  const [formData, setFormData] = useState<Partial<EpubMetadata>>({});
  const updateMetadata = useUpdateMetadata(currentBook?.sessionId || "");

  useEffect(() => {
    if (currentBook?.metadata) {
      setFormData({
        title: currentBook.metadata.title,
        creators: currentBook.metadata.creators,
        language: currentBook.metadata.language,
        publisher: currentBook.metadata.publisher,
        date: currentBook.metadata.date,
        description: currentBook.metadata.description,
        subjects: currentBook.metadata.subjects,
        rights: currentBook.metadata.rights,
      });
    }
  }, [currentBook]);

  if (!currentBook) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Upload a book first to edit its metadata.
      </div>
    );
  }

  const handleSave = async () => {
    try {
      const result = await updateMetadata.mutateAsync(formData);
      setCurrentBook({
        ...currentBook,
        metadata: { ...currentBook.metadata, ...result },
      });
      toast.success("Metadata updated successfully");
    } catch {
      toast.error("Failed to update metadata");
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = `/api/epub/${currentBook.sessionId}/download?download=true`;
    a.download = `${currentBook.metadata.title || "book"}.epub`;
    a.click();
  };

  const updateField = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Metadata Editor</h1>
          <p className="text-muted-foreground mt-1">
            Edit book information and cover image
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download EPUB
          </Button>
          <Button onClick={handleSave} disabled={updateMetadata.isPending}>
            {updateMetadata.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <CoverEditor sessionId={currentBook.sessionId} />
        </div>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Book Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) => updateField("title", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creators">Authors (comma separated)</Label>
              <Input
                id="creators"
                value={formData.creators?.join(", ") || ""}
                onChange={(e) =>
                  updateField(
                    "creators",
                    e.target.value.split(",").map((s) => s.trim())
                  )
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  value={formData.language || ""}
                  onChange={(e) => updateField("language", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  value={formData.date || ""}
                  onChange={(e) => updateField("date", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publisher">Publisher</Label>
              <Input
                id="publisher"
                value={formData.publisher || ""}
                onChange={(e) => updateField("publisher", e.target.value)}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={formData.description || ""}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subjects">
                Subjects / Tags (comma separated)
              </Label>
              <Input
                id="subjects"
                value={formData.subjects?.join(", ") || ""}
                onChange={(e) =>
                  updateField(
                    "subjects",
                    e.target.value.split(",").map((s) => s.trim())
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rights">Rights</Label>
              <Input
                id="rights"
                value={formData.rights || ""}
                onChange={(e) => updateField("rights", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
