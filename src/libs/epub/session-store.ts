import fs from "fs/promises";
import path from "path";
import { EpubParser } from "./epub-parser";

const BASE_DIR = path.join(process.cwd(), "tmp", "ebook-sessions");

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export function getSessionDir(sessionId: string): string {
  return path.join(BASE_DIR, sessionId);
}

export function getEpubPath(sessionId: string): string {
  return path.join(getSessionDir(sessionId), "book.epub");
}

export async function saveEpub(
  sessionId: string,
  buffer: Buffer
): Promise<void> {
  const dir = getSessionDir(sessionId);
  await ensureDir(dir);
  await fs.writeFile(getEpubPath(sessionId), buffer);
}

export async function loadEpubParser(
  sessionId: string
): Promise<EpubParser> {
  const epubPath = getEpubPath(sessionId);
  const buffer = await fs.readFile(epubPath);
  const parser = new EpubParser(buffer.buffer as ArrayBuffer);
  await parser.parse();
  return parser;
}

export async function saveEpubFromParser(
  sessionId: string,
  parser: EpubParser
): Promise<void> {
  const buffer = await parser.toBuffer();
  await fs.writeFile(getEpubPath(sessionId), buffer);
}

export async function sessionExists(sessionId: string): Promise<boolean> {
  try {
    await fs.access(getEpubPath(sessionId));
    return true;
  } catch {
    return false;
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  const dir = getSessionDir(sessionId);
  await fs.rm(dir, { recursive: true, force: true });
}

export async function listSessions(): Promise<string[]> {
  await ensureDir(BASE_DIR);
  const entries = await fs.readdir(BASE_DIR, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}
