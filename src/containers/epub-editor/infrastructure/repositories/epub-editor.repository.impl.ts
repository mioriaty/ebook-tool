import type { IEpubEditorRepository } from "@/core/epub-editor/domain/repositories/epub-editor.repository";
import type { EpubChapter } from "@/shared/types/epub";
import { fetchClient } from "@/libs/api/fetch-client";

export class EpubEditorRepositoryImpl implements IEpubEditorRepository {
  async getChapters(sessionId: string): Promise<EpubChapter[]> {
    return fetchClient.get<EpubChapter[]>(`/api/epub/${sessionId}/chapters`);
  }

  async getChapterContent(sessionId: string, chapterHref: string): Promise<string> {
    const encoded = encodeURIComponent(chapterHref);
    return fetchClient.get<string>(`/api/epub/${sessionId}/chapters/${encoded}`);
  }

  async updateChapterContent(sessionId: string, chapterHref: string, content: string): Promise<void> {
    const encoded = encodeURIComponent(chapterHref);
    return fetchClient.put(`/api/epub/${sessionId}/chapters/${encoded}`, { content });
  }

  async downloadEpub(sessionId: string): Promise<Blob> {
    return fetchClient.download(`/api/epub/${sessionId}/download`);
  }
}
