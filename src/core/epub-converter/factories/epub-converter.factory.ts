import { EpubConverterRepositoryImpl } from "@/containers/epub-converter/infrastructure/repositories/epub-converter.repository.impl";
import { ConvertEpubUseCase } from "../application/use-cases/convert-epub.use-case";

const epubConverterRepository = new EpubConverterRepositoryImpl();

export const convertEpubUseCase = new ConvertEpubUseCase(epubConverterRepository);
