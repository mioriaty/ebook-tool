import type { IEpubConverterRepository } from "../../domain/repositories/epub-converter.repository";
import type { ConvertOptions } from "@/shared/types/epub";

export class ConvertEpubUseCase {
  constructor(private readonly repository: IEpubConverterRepository) {}

  execute(sessionId: string, options: ConvertOptions): Promise<Blob> {
    return this.repository.convert(sessionId, options);
  }
}
