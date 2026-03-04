import { NextRequest, NextResponse } from "next/server";
import Typo from "typo-js";
import { loadEpubParser, sessionExists } from "@/libs/epub/session-store";
import type { SpellCheckResult } from "@/shared/types/epub";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractWords(text: string): { word: string; offset: number }[] {
  const regex = /[\p{L}'-]+/gu;
  const results: { word: string; offset: number }[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[0].length > 1) {
      results.push({ word: match[0], offset: match.index });
    }
  }
  return results;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: sessionId } = await params;

    if (!(await sessionExists(sessionId))) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const requestedLang = body.language as string | undefined;

    const parser = await loadEpubParser(sessionId);
    const metadata = parser.getMetadata(sessionId);
    const chapters = parser.getChapters();

    const language = requestedLang || metadata.language || "en";

    const dictMap: Record<string, string> = {
      en: "en_US",
      vi: "vi",
      "en-US": "en_US",
      "en-GB": "en_GB",
    };

    const dictName = dictMap[language] || "en_US";

    let dictionary: Typo;
    try {
      dictionary = new Typo(dictName);
    } catch {
      return NextResponse.json(
        { error: `Dictionary not found for language: ${language}` },
        { status: 400 }
      );
    }

    const results: SpellCheckResult[] = [];

    for (const chapter of chapters) {
      const html = await parser.getChapterContent(chapter.href);
      const text = stripHtmlTags(html);
      const words = extractWords(text);

      for (const { word, offset } of words) {
        if (!dictionary.check(word)) {
          const contextStart = Math.max(0, offset - 20);
          const contextEnd = Math.min(text.length, offset + word.length + 20);
          const context = text.slice(contextStart, contextEnd);

          results.push({
            word,
            offset,
            line: 0,
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            suggestions: dictionary.suggest(word).slice(0, 5),
            context,
          });
        }
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Spell check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
