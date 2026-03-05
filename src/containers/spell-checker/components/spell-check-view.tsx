"use client";

import { useState } from "react";
import { useEpubContext } from "@/containers/shared/components/epub-context";
import { useSpellCheck } from "../hooks/use-spell-check";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpellCheck, Loader2, AlertCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { SpellCheckResult } from "@/shared/types/epub";

const MAX_UNIQUE_WORDS = 500;
const MAX_RENDER_PER_CHAPTER = 100;

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "vi", label: "Vietnamese" },
];

export function SpellCheckView() {
  const { currentBook } = useEpubContext();
  const [language, setLanguage] = useState("en");
  const [results, setResults] = useState<SpellCheckResult[]>([]);

  const spellCheckMutation = useSpellCheck(currentBook?.sessionId || "");

  if (!currentBook) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Upload a book first to check spelling.
      </div>
    );
  }

  const handleCheck = async () => {
    try {
      const data = await spellCheckMutation.mutateAsync(language);
      setResults(data);
      if (data.length === 0) {
        toast.success("No spelling errors found!");
      } else {
        toast.info(`Found ${data.length} potential spelling issues`);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Spell check failed";
      toast.error(message);
    }
  };

  const groupedResults = results.reduce<
    Record<string, SpellCheckResult[]>
  >((acc, result) => {
    const key = result.chapterTitle || result.chapterId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(result);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Spell Checker</h1>
        <p className="text-muted-foreground mt-1">
          Check spelling across all chapters of &ldquo;
          {currentBook.metadata.title}&rdquo;
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Language</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleCheck}
              disabled={spellCheckMutation.isPending}
              size="lg"
            >
              {spellCheckMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <SpellCheck className="h-4 w-4 mr-2" />
                  Check Spelling
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {results.length} unique misspelled words found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.length >= MAX_UNIQUE_WORDS && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-md">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Showing first {MAX_UNIQUE_WORDS} unique words. Fix these and run again to see more.
              </div>
            )}
            <ScrollArea className="h-[60vh]">
              <div className="space-y-6">
                {Object.entries(groupedResults).map(([chapterTitle, issues]) => {
                  const visible = issues.slice(0, MAX_RENDER_PER_CHAPTER);
                  const hidden = issues.length - visible.length;
                  return (
                    <div key={chapterTitle}>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        {chapterTitle}
                        <Badge variant="secondary">{issues.length}</Badge>
                      </h3>
                      <div className="space-y-2">
                        {visible.map((issue, idx) => (
                          <div
                            key={`${issue.word}-${issue.offset}-${idx}`}
                            className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                          >
                            <Badge variant="destructive" className="shrink-0 mt-0.5">
                              {issue.word}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-muted-foreground truncate">
                                ...{issue.context}...
                              </p>
                              {issue.suggestions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  <span className="text-xs text-muted-foreground">
                                    Suggestions:
                                  </span>
                                  {issue.suggestions.map((s) => (
                                    <Badge
                                      key={s}
                                      variant="outline"
                                      className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                    >
                                      {s}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {hidden > 0 && (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            +{hidden} more in this chapter
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {spellCheckMutation.isSuccess && results.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <SpellCheck className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-medium">No spelling errors found!</p>
            <p className="text-sm text-muted-foreground mt-1">
              All words in the book are correctly spelled.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
