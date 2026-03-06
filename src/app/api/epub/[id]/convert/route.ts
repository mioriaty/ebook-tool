import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import {
  getEpubPath,
  getSessionDir,
  sessionExists,
} from "@/libs/epub/session-store";
const SUPPORTED_CONVERT_FORMATS: Record<string, string> = {
  azw3: "AZW3 (Kindle)",
  mobi: "MOBI (Kindle Legacy)",
  pdf: "PDF",
  docx: "DOCX (Word)",
  txt: "Plain Text",
  htmlz: "HTML (Zipped)",
};

const execFileAsync = promisify(execFile);

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function findCalibreConvert(): Promise<string> {
  const possiblePaths = [
    "/Applications/calibre.app/Contents/MacOS/ebook-convert",
    "/usr/bin/ebook-convert",
    "/usr/local/bin/ebook-convert",
    "ebook-convert",
  ];

  for (const p of possiblePaths) {
    try {
      await execFileAsync(p, ["--version"]);
      return p;
    } catch {
      continue;
    }
  }

  throw new Error(
    "Conversion tool (ebook-convert) not found. Please ensure it is installed and in your PATH.",
  );
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: sessionId } = await params;

    if (!(await sessionExists(sessionId))) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const { outputFormat, fontSize, margin } = await request.json();

    if (!outputFormat || !SUPPORTED_CONVERT_FORMATS[outputFormat]) {
      return NextResponse.json(
        {
          error: `Unsupported format. Supported: ${Object.keys(
            SUPPORTED_CONVERT_FORMATS,
          ).join(", ")}`,
        },
        { status: 400 },
      );
    }

    const calibrePath = await findCalibreConvert();
    const inputPath = getEpubPath(sessionId);
    const outputPath = path.join(
      getSessionDir(sessionId),
      `output.${outputFormat}`,
    );

    const args = [inputPath, outputPath];
    if (fontSize) args.push("--base-font-size", String(fontSize));
    if (margin) {
      args.push("--margin-top", String(margin));
      args.push("--margin-bottom", String(margin));
      args.push("--margin-left", String(margin));
      args.push("--margin-right", String(margin));
    }

    await execFileAsync(calibrePath, args, {
      timeout: 120000,
      env: {
        ...process.env,
        TMPDIR: getSessionDir(sessionId),
        HOME: getSessionDir(sessionId),
      },
    });

    const outputBuffer = await fs.readFile(outputPath);

    const mimeTypes: Record<string, string> = {
      azw3: "application/x-mobi8-ebook",
      mobi: "application/x-mobipocket-ebook",
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
      htmlz: "application/zip",
    };

    await fs.unlink(outputPath).catch(() => {});

    return new NextResponse(outputBuffer, {
      headers: {
        "Content-Type": mimeTypes[outputFormat] || "application/octet-stream",
        "Content-Disposition": `attachment; filename="book-${sessionId.slice(
          0,
          8,
        )}.${outputFormat}"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Conversion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
