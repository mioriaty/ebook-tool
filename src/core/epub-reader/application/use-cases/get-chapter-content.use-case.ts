import type { IEpubReaderRepository } from "../../domain/repositories/epub-reader.repository";

export class GetChapterContentUseCase {
  constructor(private readonly repository: IEpubReaderRepository) {}

  execute(sessionId: string, href: string): Promise<string> {
    return this.repository.getChapterContent(sessionId, href);
  }
}
