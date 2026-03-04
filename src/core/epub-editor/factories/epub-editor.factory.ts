import { EpubEditorRepositoryImpl } from "@/containers/epub-editor/infrastructure/repositories/epub-editor.repository.impl";
import { GetChaptersUseCase } from "../application/use-cases/get-chapters.use-case";
import { GetEditorChapterContentUseCase } from "../application/use-cases/get-chapter-content.use-case";
import { UpdateChapterUseCase } from "../application/use-cases/update-chapter.use-case";

const epubEditorRepository = new EpubEditorRepositoryImpl();

export const getChaptersUseCase = new GetChaptersUseCase(epubEditorRepository);
export const getEditorChapterContentUseCase = new GetEditorChapterContentUseCase(epubEditorRepository);
export const updateChapterUseCase = new UpdateChapterUseCase(epubEditorRepository);
