import type { ISpellCheckerRepository } from "@/core/spell-checker/domain/repositories/spell-checker.repository";
import type { SpellCheckResult } from "@/shared/types/epub";
import { fetchClient } from "@/libs/api/fetch-client";

export class SpellCheckerRepositoryImpl implements ISpellCheckerRepository {
  async checkSpelling(sessionId: string, language?: string): Promise<SpellCheckResult[]> {
    const params = language ? { language } : {};
    return fetchClient.post<SpellCheckResult[]>(`/api/epub/${sessionId}/spellcheck`, params);
  }

  async getSuggestions(word: string, language: string): Promise<string[]> {
    return fetchClient.get<string[]>(`/api/epub/spellcheck/suggest`, {
      params: { word, language },
    });
  }
}
