import type { IEpubReaderRepository } from "@/core/epub-reader/domain/repositories/epub-reader.repository";
import type { EpubFile } from "@/shared/types/epub";
import { fetchClient } from "@/libs/api/fetch-client";

export class EpubReaderRepositoryImpl implements IEpubReaderRepository {
  async uploadEpub(file: File): Promise<EpubFile> {
    return fetchClient.uploadFile<EpubFile>("/api/epub/upload", file);
  }

  async getEpubFile(sessionId: string): Promise<EpubFile> {
    return fetchClient.get<EpubFile>(`/api/epub/${sessionId}/metadata`);
  }

  async getChapterContent(sessionId: string, href: string): Promise<string> {
    return fetchClient.get<string>(`/api/epub/${sessionId}/chapters/${encodeURIComponent(href)}`);
  }

  getFileUrl(sessionId: string): string {
    return `/api/epub/${sessionId}/download`;
  }

  async listSessions(): Promise<EpubFile[]> {
    return fetchClient.get<EpubFile[]>("/api/epub/sessions");
  }

  async deleteSession(sessionId: string): Promise<void> {
    return fetchClient.delete(`/api/epub/${sessionId}`);
  }
}
