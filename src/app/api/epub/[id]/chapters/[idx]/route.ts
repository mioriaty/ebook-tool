import { NextRequest, NextResponse } from "next/server";
import {
  loadEpubParser,
  saveEpubFromParser,
  sessionExists,
} from "@/libs/epub/session-store";

interface RouteParams {
  params: Promise<{ id: string; idx: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: sessionId, idx } = await params;
    const chapterHref = decodeURIComponent(idx);

    if (!(await sessionExists(sessionId))) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const parser = await loadEpubParser(sessionId);
    const content = await parser.getChapterContent(chapterHref);

    return NextResponse.json(content);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get chapter";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: sessionId, idx } = await params;
    const chapterHref = decodeURIComponent(idx);

    if (!(await sessionExists(sessionId))) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const { content } = await request.json();
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const parser = await loadEpubParser(sessionId);
    await parser.setChapterContent(chapterHref, content);
    await saveEpubFromParser(sessionId, parser);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update chapter";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
