import type { SpellCheckResult } from "@/shared/types/epub";

export interface ISpellCheckerRepository {
  checkSpelling(sessionId: string, language?: string): Promise<SpellCheckResult[]>;
  getSuggestions(word: string, language: string): Promise<string[]>;
}
