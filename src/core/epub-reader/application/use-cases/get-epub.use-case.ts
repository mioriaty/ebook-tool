import type { IEpubReaderRepository } from "../../domain/repositories/epub-reader.repository";
import type { EpubFile } from "@/shared/types/epub";

export class GetEpubUseCase {
  constructor(private readonly repository: IEpubReaderRepository) {}

  execute(sessionId: string): Promise<EpubFile> {
    return this.repository.getEpubFile(sessionId);
  }
}
