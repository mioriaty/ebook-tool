import { SpellCheckerRepositoryImpl } from "@/containers/spell-checker/infrastructure/repositories/spell-checker.repository.impl";
import { CheckSpellingUseCase } from "../application/use-cases/check-spelling.use-case";

const spellCheckerRepository = new SpellCheckerRepositoryImpl();

export const checkSpellingUseCase = new CheckSpellingUseCase(spellCheckerRepository);
