import { NextRequest, NextResponse } from "next/server";
import {
  loadEpubParser,
  saveEpubFromParser,
  sessionExists,
  updateLibraryEntry,
} from "@/libs/epub/session-store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: sessionId } = await params;

    if (!(await sessionExists(sessionId))) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const parser = await loadEpubParser(sessionId);

    const url = new URL(request.url);
    if (url.searchParams.get("cover") === "true") {
      const coverData = await parser.getCoverImage();
      if (!coverData) {
        return NextResponse.json(null);
      }
      const mediaType = parser.getCoverMediaType() || "image/jpeg";
      const base64 = coverData.toString("base64");
      return NextResponse.json({
        data: `data:${mediaType};base64,${base64}`,
        mediaType,
      });
    }

    const metadata = parser.getMetadata(sessionId);
    const chapters = parser.getChapters();
    const toc = await parser.getToc();

    return NextResponse.json({
      sessionId,
      filename: "",
      metadata,
      chapters,
      toc,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get metadata";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: sessionId } = await params;

    if (!(await sessionExists(sessionId))) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const coverFile = formData.get("cover") as File | null;

      if (coverFile) {
        const parser = await loadEpubParser(sessionId);
        const imageBuffer = Buffer.from(await coverFile.arrayBuffer());
        await parser.setCoverImage(imageBuffer, coverFile.type);
        await saveEpubFromParser(sessionId, parser);
        const metadata = parser.getMetadata(sessionId);
        await updateLibraryEntry(sessionId, { metadata });
        return NextResponse.json(metadata);
      }
    }

    const updates = await request.json();
    const parser = await loadEpubParser(sessionId);
    parser.updateMetadata(updates);
    await saveEpubFromParser(sessionId, parser);
    const metadata = parser.getMetadata(sessionId);
    await updateLibraryEntry(sessionId, { metadata });
    return NextResponse.json(metadata);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update metadata";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
