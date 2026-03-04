import { EpubReaderRepositoryImpl } from "@/containers/epub-reader/infrastructure/repositories/epub-reader.repository.impl";
import { UploadEpubUseCase } from "../application/use-cases/upload-epub.use-case";
import { GetEpubUseCase } from "../application/use-cases/get-epub.use-case";
import { GetChapterContentUseCase } from "../application/use-cases/get-chapter-content.use-case";

const epubReaderRepository = new EpubReaderRepositoryImpl();

export const uploadEpubUseCase = new UploadEpubUseCase(epubReaderRepository);
export const getEpubUseCase = new GetEpubUseCase(epubReaderRepository);
export const getChapterContentUseCase = new GetChapterContentUseCase(epubReaderRepository);
