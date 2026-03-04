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
    const buffer = await parser.toBuffer();
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      headers: {
        "Content-Type": "application/epub+zip",
        "Content-Disposition": `attachment; filename="book-${sessionId.slice(0, 8)}.epub"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to download";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
