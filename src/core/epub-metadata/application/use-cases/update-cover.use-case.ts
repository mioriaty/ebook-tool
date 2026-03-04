import type { IEpubMetadataRepository } from "../../domain/repositories/epub-metadata.repository";

export class UpdateCoverUseCase {
  constructor(private readonly repository: IEpubMetadataRepository) {}

  execute(sessionId: string, file: File): Promise<void> {
    return this.repository.updateCoverImage(sessionId, file);
  }
}
