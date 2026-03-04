import type { IEpubEditorRepository } from "../../domain/repositories/epub-editor.repository";

export class UpdateChapterUseCase {
  constructor(private readonly repository: IEpubEditorRepository) {}

  execute(sessionId: string, chapterHref: string, content: string): Promise<void> {
    return this.repository.updateChapterContent(sessionId, chapterHref, content);
  }
}
