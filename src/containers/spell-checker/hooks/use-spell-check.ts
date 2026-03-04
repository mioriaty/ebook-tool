"use client";

import { useMutation } from "@tanstack/react-query";
import { checkSpellingUseCase } from "@/core/spell-checker/factories/spell-checker.factory";
import type { SpellCheckResult } from "@/shared/types/epub";

export function useSpellCheck(sessionId: string) {
  return useMutation<SpellCheckResult[], Error, string | undefined>({
    mutationFn: (language?: string) =>
      checkSpellingUseCase.execute(sessionId, language),
  });
}
