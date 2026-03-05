import type { ISpellCheckerRepository } from "@/core/spell-checker/domain/repositories/spell-checker.repository";
import type { SpellCheckResult, EpubEditableFile } from "@/shared/types/epub";
import { fetchClient } from "@/libs/api/fetch-client";
import { loadPlainDictionary } from "../services/dictionary-loader.service";

const DICT_URLS: Record<string, string> = {
  vi: "/dictionaries/vi.txt",
  en: "/dictionaries/en.txt",
};

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

function extractTokens(text: string): { word: string; offset: number }[] {
  const regex = /[\p{L}\-]+/gu;
  const results: { word: string; offset: number }[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const word = match[0].replace(/^-+|-+$/g, "");
    if (word.length > 0) {
      results.push({ word, offset: match.index });
    }
  }
  return results;
}

const MAX_UNIQUE_WORDS = 500;

export class SpellCheckerRepositoryImpl implements ISpellCheckerRepository {
  async checkSpelling(
    sessionId: string,
    language = "vi"
  ): Promise<SpellCheckResult[]> {
    const dictUrl = DICT_URLS[language];
    if (!dictUrl) {
      throw new Error(
        `No local dictionary available for language: "${language}". Currently supported: ${Object.keys(DICT_URLS).join(", ")}.`
      );
    }

    const [dictionary, files] = await Promise.all([
      loadPlainDictionary(dictUrl),
      fetchClient.get<EpubEditableFile[]>(`/api/epub/${sessionId}/files`),
    ]);

    const xhtmlFiles = files.filter((f) => f.category === "xhtml");
    const results: SpellCheckResult[] = [];
    const seenWords = new Set<string>();

    outer: for (const file of xhtmlFiles) {
      const html = await fetchClient.get<string>(
        `/api/epub/${sessionId}/chapters/${encodeURIComponent(file.href)}`
      );

      const text = stripHtmlTags(html);
      const tokens = extractTokens(text);

      for (const { word, offset } of tokens) {
        const lower = word.toLowerCase();
        // Skip proper nouns: starts with uppercase AND lowercase form not in dictionary
        if (/^\p{Lu}/u.test(word) && !dictionary.has(lower)) continue;
        if (dictionary.has(lower) || seenWords.has(lower)) continue;

        seenWords.add(lower);
        const contextStart = Math.max(0, offset - 30);
        const contextEnd = Math.min(text.length, offset + word.length + 30);
        results.push({
          word,
          offset,
          line: 0,
          chapterId: file.id,
          chapterTitle: file.title,
          suggestions: [],
          context: text.slice(contextStart, contextEnd),
        });

        if (results.length >= MAX_UNIQUE_WORDS) break outer;
      }
    }

    return results;
  }

  async getSuggestions(_word: string, _language: string): Promise<string[]> {
    return [];
  }
}
