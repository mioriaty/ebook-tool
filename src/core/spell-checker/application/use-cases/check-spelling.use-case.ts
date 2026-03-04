import type { ISpellCheckerRepository } from "../../domain/repositories/spell-checker.repository";
import type { SpellCheckResult } from "@/shared/types/epub";

export class CheckSpellingUseCase {
  constructor(private readonly repository: ISpellCheckerRepository) {}

  execute(sessionId: string, language?: string): Promise<SpellCheckResult[]> {
    return this.repository.checkSpelling(sessionId, language);
  }
}
