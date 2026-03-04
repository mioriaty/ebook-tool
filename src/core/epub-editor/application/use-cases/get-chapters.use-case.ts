import type { IEpubEditorRepository } from "../../domain/repositories/epub-editor.repository";
import type { EpubChapter } from "@/shared/types/epub";

export class GetChaptersUseCase {
  constructor(private readonly repository: IEpubEditorRepository) {}

  execute(sessionId: string): Promise<EpubChapter[]> {
    return this.repository.getChapters(sessionId);
  }
}
