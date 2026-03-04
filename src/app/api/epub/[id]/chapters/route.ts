import { NextResponse } from "next/server";
import { loadEpubParser, sessionExists } from "@/libs/epub/session-store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id: sessionId } = await params;

    if (!(await sessionExists(sessionId))) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const parser = await loadEpubParser(sessionId);
    const chapters = parser.getChapters();

    return NextResponse.json(chapters);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get chapters";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
