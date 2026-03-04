import type { IEpubEditorRepository } from "../../domain/repositories/epub-editor.repository";

export class GetEditorChapterContentUseCase {
  constructor(private readonly repository: IEpubEditorRepository) {}

  execute(sessionId: string, chapterHref: string): Promise<string> {
    return this.repository.getChapterContent(sessionId, chapterHref);
  }
}
