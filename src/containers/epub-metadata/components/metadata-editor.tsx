"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEpubContext } from "@/containers/shared/components/epub-context";
import { useUpdateMetadata } from "../hooks/use-metadata";
import { CoverEditor } from "./cover-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Save, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { EpubMetadata } from "@/shared/types/epub";

const metadataSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  creators: z.string().optional(), // We'll handle comma-separated strings
  language: z.string().optional(),
  date: z.string().optional(),
  publisher: z.string().optional(),
  description: z.string().optional(),
  subjects: z.string().optional(), // We'll handle comma-separated strings
  rights: z.string().optional(),
});

type MetadataFormValues = z.infer<typeof metadataSchema>;

export function MetadataEditor() {
  const { currentBook, setCurrentBook } = useEpubContext();
  const updateMetadata = useUpdateMetadata(currentBook?.sessionId || "");

  const form = useForm<MetadataFormValues>({
    // @ts-expect-error Zod version mismatch with @hookform/resolvers
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      title: "",
      creators: "",
      language: "",
      date: "",
      publisher: "",
      description: "",
      subjects: "",
      rights: "",
    },
  });

  // Reset form when current book changes
  useEffect(() => {
    if (currentBook?.metadata) {
      form.reset({
        title: currentBook.metadata.title || "",
        creators: currentBook.metadata.creators?.join(", ") || "",
        language: currentBook.metadata.language || "",
        date: currentBook.metadata.date || "",
        publisher: currentBook.metadata.publisher || "",
        description: currentBook.metadata.description || "",
        subjects: currentBook.metadata.subjects?.join(", ") || "",
        rights: currentBook.metadata.rights || "",
      });
    }
  }, [currentBook, form]);

  if (!currentBook) {
    return (
      <div
        className="text-center text-muted-foreground py-12"
        role="status"
        aria-live="polite"
      >
        Upload a book first to edit its metadata.
      </div>
    );
  }

  const onSubmit = async (data: MetadataFormValues) => {
    try {
      const parsedData: Partial<EpubMetadata> = {
        title: data.title,
        creators:
          data.creators
            ?.split(",")
            .map((s) => s.trim())
            .filter(Boolean) || [],
        language: data.language,
        date: data.date,
        publisher: data.publisher,
        description: data.description,
        subjects:
          data.subjects
            ?.split(",")
            .map((s) => s.trim())
            .filter(Boolean) || [],
        rights: data.rights,
      };

      const result = await updateMetadata.mutateAsync(parsedData);
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Metadata Editor</h1>
            <p className="text-muted-foreground mt-1">
              Edit book information and cover image
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download EPUB
            </Button>
            <Button type="submit" disabled={updateMetadata.isPending}>
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
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Book title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="creators"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authors</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe, Jane Smith" {...field} />
                    </FormControl>
                    <FormDescription>Comma separated</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <FormControl>
                        <Input placeholder="en" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input placeholder="YYYY-MM-DD" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="publisher"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publisher</FormLabel>
                    <FormControl>
                      <Input placeholder="Publisher name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Book description..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subjects"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subjects / Tags</FormLabel>
                    <FormControl>
                      <Input placeholder="Fiction, Fantasy, Magic" {...field} />
                    </FormControl>
                    <FormDescription>Comma separated</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rights"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rights</FormLabel>
                    <FormControl>
                      <Input placeholder="Copyright © 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
}
