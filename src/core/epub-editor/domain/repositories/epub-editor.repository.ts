import type { EpubChapter } from "@/shared/types/epub";

export interface IEpubEditorRepository {
  getChapters(sessionId: string): Promise<EpubChapter[]>;
  getChapterContent(sessionId: string, chapterHref: string): Promise<string>;
  updateChapterContent(sessionId: string, chapterHref: string, content: string): Promise<void>;
  downloadEpub(sessionId: string): Promise<Blob>;
}
