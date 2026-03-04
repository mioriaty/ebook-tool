import type { IEpubMetadataRepository } from "../../domain/repositories/epub-metadata.repository";
import type { EpubMetadata } from "@/shared/types/epub";

export class GetMetadataUseCase {
  constructor(private readonly repository: IEpubMetadataRepository) {}

  execute(sessionId: string): Promise<EpubMetadata> {
    return this.repository.getMetadata(sessionId);
  }
}
