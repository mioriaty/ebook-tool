import type { IEpubConverterRepository } from "../../domain/repositories/epub-converter.repository";

export class ConvertEpubUseCase {
  constructor(private readonly repository: IEpubConverterRepository) {}

  async execute(sessionId: string): Promise<Blob> {
    // Fetch the raw epub bytes from the server download endpoint
    const response = await fetch(`/api/epub/${sessionId}/download`);
    if (!response.ok) {
      throw new Error("Failed to fetch EPUB file");
    }
    const arrayBuffer = await response.arrayBuffer();
    return this.repository.convertToTxt(arrayBuffer);
  }
}
