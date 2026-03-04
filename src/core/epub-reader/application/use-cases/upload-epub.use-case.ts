import type { IEpubReaderRepository } from "../../domain/repositories/epub-reader.repository";
import type { EpubFile } from "@/shared/types/epub";

export class UploadEpubUseCase {
  constructor(private readonly repository: IEpubReaderRepository) {}

  execute(file: File): Promise<EpubFile> {
    return this.repository.uploadEpub(file);
  }
}
