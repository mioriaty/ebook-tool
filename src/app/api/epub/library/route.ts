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
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    await removeFromLibrary(sessionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete book";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
