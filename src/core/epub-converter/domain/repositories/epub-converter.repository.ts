import type { ConvertOptions } from "@/shared/types/epub";

export interface IEpubConverterRepository {
  convert(sessionId: string, options: ConvertOptions): Promise<Blob>;
  getSupportedFormats(): Promise<Record<string, string>>;
}
