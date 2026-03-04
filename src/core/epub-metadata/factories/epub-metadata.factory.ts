import { EpubMetadataRepositoryImpl } from "@/containers/epub-metadata/infrastructure/repositories/epub-metadata.repository.impl";
import { GetMetadataUseCase } from "../application/use-cases/get-metadata.use-case";
import { UpdateMetadataUseCase } from "../application/use-cases/update-metadata.use-case";
import { UpdateCoverUseCase } from "../application/use-cases/update-cover.use-case";

const epubMetadataRepository = new EpubMetadataRepositoryImpl();

export const getMetadataUseCase = new GetMetadataUseCase(epubMetadataRepository);
export const updateMetadataUseCase = new UpdateMetadataUseCase(epubMetadataRepository);
export const updateCoverUseCase = new UpdateCoverUseCase(epubMetadataRepository);
