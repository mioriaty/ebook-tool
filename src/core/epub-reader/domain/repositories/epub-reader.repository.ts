import type { EpubFile, EpubChapter, EpubToc } from "@/shared/types/epub";

export interface IEpubReaderRepository {
  uploadEpub(file: File): Promise<EpubFile>;
  getEpubFile(sessionId: string): Promise<EpubFile>;
  getChapterContent(sessionId: string, href: string): Promise<string>;
  getFileUrl(sessionId: string): string;
  listSessions(): Promise<EpubFile[]>;
  deleteSession(sessionId: string): Promise<void>;
}
