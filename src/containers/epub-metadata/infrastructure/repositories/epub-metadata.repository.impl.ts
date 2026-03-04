import type { IEpubMetadataRepository } from "@/core/epub-metadata/domain/repositories/epub-metadata.repository";
import type { EpubMetadata } from "@/shared/types/epub";
import { fetchClient } from "@/libs/api/fetch-client";

export class EpubMetadataRepositoryImpl implements IEpubMetadataRepository {
  async getMetadata(sessionId: string): Promise<EpubMetadata> {
    return fetchClient.get<EpubMetadata>(`/api/epub/${sessionId}/metadata`);
  }

  async updateMetadata(sessionId: string, updates: Partial<EpubMetadata>): Promise<EpubMetadata> {
    return fetchClient.put<EpubMetadata>(`/api/epub/${sessionId}/metadata`, updates);
  }

  async getCoverImage(sessionId: string): Promise<{ data: string; mediaType: string } | null> {
    return fetchClient.get(`/api/epub/${sessionId}/metadata?cover=true`);
  }

  async updateCoverImage(sessionId: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append("cover", file);
    return fetchClient.post(`/api/epub/${sessionId}/metadata?action=cover`, formData);
  }
}
