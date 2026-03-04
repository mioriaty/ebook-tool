"use client";

import { useState } from "react";
import { useEpubContext } from "@/containers/shared/components/epub-context";
import { useConvertEpub } from "../hooks/use-convert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { SUPPORTED_CONVERT_FORMATS } from "@/shared/types/epub";

export function ConverterView() {
  const { currentBook } = useEpubContext();
  const [outputFormat, setOutputFormat] = useState("pdf");
  const [fontSize, setFontSize] = useState("");
  const [margin, setMargin] = useState("");

  const convertMutation = useConvertEpub(currentBook?.sessionId || "");

  if (!currentBook) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Upload a book first to convert it.
      </div>
    );
  }

  const handleConvert = async () => {
    try {
      await convertMutation.mutateAsync({
        outputFormat,
        fontSize: fontSize ? Number(fontSize) : undefined,
        margin: margin ? Number(margin) : undefined,
      });
      toast.success(`Converted to ${SUPPORTED_CONVERT_FORMATS[outputFormat]}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Conversion failed";
      toast.error(message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Format Converter</h1>
        <p className="text-muted-foreground mt-1">
          Convert &ldquo;{currentBook.metadata.title}&rdquo; to other formats
          using Calibre
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>
              Requires Calibre installed on your system. Install with:{" "}
              <code className="font-mono bg-background px-1 rounded">
                brew install calibre
              </code>
            </span>
          </div>

          <div className="space-y-2">
            <Label>Output Format</Label>
            <Select value={outputFormat} onValueChange={setOutputFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUPPORTED_CONVERT_FORMATS).map(
                  ([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fontSize">Base Font Size (pt)</Label>
              <Input
                id="fontSize"
                type="number"
                placeholder="Default"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="margin">Margin (pt)</Label>
              <Input
                id="margin"
                type="number"
                placeholder="Default"
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleConvert}
            disabled={convertMutation.isPending}
            className="w-full"
            size="lg"
          >
            {convertMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Convert to {SUPPORTED_CONVERT_FORMATS[outputFormat]}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
