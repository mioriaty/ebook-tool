import { NextResponse } from "next/server";
import { Resend } from "resend";
import { config } from "@/shared/config";
import fs from "fs/promises";
import { getLibrary, getEpubPath } from "@/libs/epub/session-store";

// NOTE: Please ensure RESEND_API_KEY is configured in your .env.local file.
// If missing, this will throw during initialization.
const resend = new Resend(config.resendApiKey || "re_placeholder");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sessionId = body.sessionId as string | null;
    const kindleEmail = body.kindleEmail as string | null;

    if (!sessionId || !kindleEmail) {
      return NextResponse.json(
        { error: "Thiếu thông tin sách hoặc email Kindle." },
        { status: 400 },
      );
    }

    // Load library to find book metadata
    const library = await getLibrary();
    const book = library.find((b) => b.sessionId === sessionId);

    if (!book) {
      return NextResponse.json(
        { error: "Không tìm thấy thông tin sách trong thư viện." },
        { status: 404 },
      );
    }

    const epubPath = getEpubPath(sessionId);
    let fileBuffer: Buffer;

    try {
      fileBuffer = await fs.readFile(epubPath);
    } catch {
      return NextResponse.json(
        { error: "Không thể đọc file sách. File có thể đã bị xóa." },
        { status: 404 },
      );
    }

    const filename = book.metadata.title
      ? `${book.metadata.title}.epub`
      : "book.epub";

    // Get sender email from env variable, use a fallback if not set.
    const senderEmail = config.senderEmail || "delivery@ebook-tool.com";

    // Send email using Resend
    const data = await resend.emails.send({
      from: `Ebook Tool <${senderEmail}>`,
      to: [kindleEmail],
      subject: `Tài liệu gửi đến Kindle: ${book.metadata.title || "Sách từ Ebook Tool"}`,
      html: "<p>Tài liệu này được gửi từ Ebook Tools.</p>",
      attachments: [
        {
          filename: filename,
          content: fileBuffer,
        },
      ],
    });

    if (data.error) {
      console.error("Lỗi khi gửi email qua Resend:", data.error);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Send to Kindle API error:", error);
    return NextResponse.json(
      { error: "Lỗi server khi gửi sách đến Kindle." },
      { status: 500 },
    );
  }
}
