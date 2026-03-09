import { NextRequest, NextResponse } from "next/server";
import { getLibrary, removeFromLibrary } from "@/libs/epub/session-store";

export async function GET() {
  try {
    const library = await getLibrary();
    return NextResponse.json(library);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load library";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionIds = body.sessionIds || body.sessionId;

    if (!sessionIds || (Array.isArray(sessionIds) && sessionIds.length === 0)) {
      return NextResponse.json(
        { error: "sessionId or sessionIds array is required" },
        { status: 400 },
      );
    }

    await removeFromLibrary(sessionIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete book(s)";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
