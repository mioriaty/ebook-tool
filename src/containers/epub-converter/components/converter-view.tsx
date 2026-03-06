"use client";

import { useEpubContext } from "@/containers/shared/components/epub-context";
import { useConvertToTxt } from "../hooks/use-convert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ConverterView() {
  const { currentBook } = useEpubContext();

  const convertMutation = useConvertToTxt(
    currentBook?.sessionId ?? "",
    currentBook?.metadata.title ?? "",
  );

  if (!currentBook) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Upload a book first to convert it.
      </div>
    );
  }

  const handleConvert = async () => {
    try {
      await convertMutation.mutateAsync();
      toast.success("Converted to plain text and downloading…");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Conversion failed";
      toast.error(message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Export to Text</h1>
        <p className="text-muted-foreground mt-1">
          Convert &ldquo;{currentBook.metadata.title}&rdquo; to plain text
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plain Text Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Extracts readable text from the EPUB directly in your browser. No
            server-side processing or external tools required. Headings, lists,
            and bold text are preserved in Markdown-compatible format.
          </p>

          <Button
            onClick={handleConvert}
            disabled={convertMutation.isPending}
            className="w-full"
            size="lg"
          >
            {convertMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Extracting text…
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Download as .txt
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
