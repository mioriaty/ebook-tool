export interface EpubMetadata {
  id: string;
  title: string;
  creators: string[];
  language: string;
  publisher: string;
  date: string;
  description: string;
  identifier: string;
  subjects: string[];
  rights: string;
  coverImagePath: string | null;
}

export interface EpubChapter {
  id: string;
  href: string;
  title: string;
  order: number;
}

export interface EpubManifestItem {
  id: string;
  href: string;
  mediaType: string;
}

export interface EpubSpineItem {
  idref: string;
  linear: boolean;
}

export interface EpubToc {
  id: string;
  href: string;
  label: string;
  children: EpubToc[];
}

export interface EpubFile {
  sessionId: string;
  filename: string;
  metadata: EpubMetadata;
  chapters: EpubChapter[];
  toc: EpubToc[];
}

export interface ConvertOptions {
  outputFormat: string;
  fontSize?: number;
  margin?: number;
}

export interface SpellCheckResult {
  word: string;
  offset: number;
  line: number;
  chapterId: string;
  chapterTitle: string;
  suggestions: string[];
  context: string;
}

export const SUPPORTED_CONVERT_FORMATS: Record<string, string> = {
  azw3: "AZW3 (Kindle)",
  mobi: "MOBI (Kindle Legacy)",
  pdf: "PDF",
  docx: "DOCX (Word)",
  txt: "Plain Text",
  htmlz: "HTML (Zipped)",
};
