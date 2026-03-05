import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { EpubParser } from "@/libs/epub/epub-parser";
import { saveEpub, addToLibrary, cleanupExpiredSessions } from "@/libs/epub/session-store";
import type { EpubFile } from "@/shared/types/epub";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".epub")) {
      return NextResponse.json(
        { error: "Only .epub files are accepted" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sessionId = uuidv4();

    await saveEpub(sessionId, buffer);

    const parser = new EpubParser(buffer.buffer as ArrayBuffer);
    await parser.parse();

    const metadata = parser.getMetadata(sessionId);
    const chapters = parser.getChapters();
    const toc = await parser.getToc();

    const epubFile: EpubFile = {
      sessionId,
      filename: file.name,
      metadata,
      chapters,
      toc,
      addedAt: new Date().toISOString(),
    };

    await addToLibrary(epubFile);

    // Run cleanup in background, does not block response
    cleanupExpiredSessions().catch(console.error);

    return NextResponse.json(epubFile);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
