import type { IEpubMetadataRepository } from "../../domain/repositories/epub-metadata.repository";
import type { EpubMetadata } from "@/shared/types/epub";

export class UpdateMetadataUseCase {
  constructor(private readonly repository: IEpubMetadataRepository) {}

  execute(sessionId: string, updates: Partial<EpubMetadata>): Promise<EpubMetadata> {
    return this.repository.updateMetadata(sessionId, updates);
  }
}
