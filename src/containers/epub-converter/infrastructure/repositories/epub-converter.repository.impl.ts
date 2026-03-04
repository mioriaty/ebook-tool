import type { IEpubConverterRepository } from "@/core/epub-converter/domain/repositories/epub-converter.repository";
import type { ConvertOptions } from "@/shared/types/epub";
import { fetchClient } from "@/libs/api/fetch-client";

export class EpubConverterRepositoryImpl implements IEpubConverterRepository {
  async convert(sessionId: string, options: ConvertOptions): Promise<Blob> {
    const response = await fetch(`/api/epub/${sessionId}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
    }
    return response.blob();
  }

  async getSupportedFormats(): Promise<Record<string, string>> {
    return fetchClient.get<Record<string, string>>("/api/epub/formats");
  }
}
