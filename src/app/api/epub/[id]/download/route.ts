import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import { getEpubPath, sessionExists } from "@/libs/epub/session-store";

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

    const filePath = getEpubPath(sessionId);
    const fileBuffer = await fs.readFile(filePath);
    const uint8 = new Uint8Array(fileBuffer);

    const url = new URL(request.url);
    const isDownload = url.searchParams.get("download") === "true";

    const headers: Record<string, string> = {
      "Content-Type": "application/epub+zip",
      "Content-Length": String(uint8.byteLength),
    };

    if (isDownload) {
      headers["Content-Disposition"] =
        `attachment; filename="book-${sessionId.slice(0, 8)}.epub"`;
    }

    return new NextResponse(uint8, { headers });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to download";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
