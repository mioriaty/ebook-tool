import type { EpubMetadata } from "@/shared/types/epub";

export interface IEpubMetadataRepository {
  getMetadata(sessionId: string): Promise<EpubMetadata>;
  updateMetadata(sessionId: string, updates: Partial<EpubMetadata>): Promise<EpubMetadata>;
  getCoverImage(sessionId: string): Promise<{ data: string; mediaType: string } | null>;
  updateCoverImage(sessionId: string, file: File): Promise<void>;
}
