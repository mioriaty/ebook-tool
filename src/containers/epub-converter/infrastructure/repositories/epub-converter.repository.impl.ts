import JSZip from "jszip";
import type { IEpubConverterRepository } from "@/core/epub-converter/domain/repositories/epub-converter.repository";

// Block-level HTML tags that require newlines
const BLOCK_TAGS = new Set([
  "P",
  "DIV",
  "BLOCKQUOTE",
  "SECTION",
  "ARTICLE",
  "MAIN",
  "ASIDE",
  "HEADER",
  "FOOTER",
  "NAV",
  "FIGURE",
  "FIGCAPTION",
  "ADDRESS",
  "TABLE",
  "THEAD",
  "TBODY",
  "TFOOT",
  "TR",
  "TD",
  "TH",
  "CAPTION",
  "DL",
  "DT",
  "DD",
  "HR",
  "DETAILS",
  "SUMMARY",
]);

// Preformatted tags (preserve whitespace)
const PRE_TAGS = new Set(["PRE", "CODE"]);

// Heading tags mapped to depth
const HEADING_TAGS: Record<string, number> = {
  H1: 1,
  H2: 2,
  H3: 3,
  H4: 4,
  H5: 5,
  H6: 6,
};

const MAX_HEADING_LEVEL = 4;

interface TextSegment {
  text: string;
  pre: boolean;
}

interface CollectState {
  hasContent: boolean;
  lastWasSeparator: boolean;
}

function isMathBlock(node: Element): boolean {
  const display = (node.getAttribute("display") || "").toLowerCase();
  if (display === "block") return true;
  const className = (node.getAttribute("class") || "").toLowerCase();
  return className.includes("block") || className.includes("display");
}

function isMathLikeClass(node: Element): boolean {
  const className = (node.getAttribute("class") || "").toLowerCase();
  return (
    className.includes("math") ||
    className.includes("katex") ||
    className.includes("latex") ||
    className.includes("equation")
  );
}

function looksLikeLatex(text: string): boolean {
  return /\\[A-Za-z]+|[_^]|\\frac|\\sum|\\int/.test(text || "");
}

function getMathAnnotationLatex(node: Element): string {
  const annotations = node.getElementsByTagName("annotation");
  for (const ann of annotations) {
    const encoding = (ann.getAttribute("encoding") || "").toLowerCase();
    if (encoding.includes("tex") || encoding.includes("latex")) {
      const text = (ann.textContent || "").trim();
      if (text) return text;
    }
  }
  return "";
}

/**
 * Recursively collects text segments from a DOM element.
 * Port of the epub2txt algorithm: https://github.com/SPACESODA/epub2txt/blob/main/app/epub2txt.js
 */
function collectTextSegments(
  element: Node,
  inPre = false,
  segments: TextSegment[] = [],
  state: CollectState | null = null,
  listDepth = 0,
): TextSegment[] {
  if (!element) return segments;
  if (!state) state = { hasContent: false, lastWasSeparator: false };

  const pushSegment = (text: string, pre: boolean, isContent = false) => {
    if (!text) return;
    segments.push({ text, pre });
    if (isContent) {
      state!.hasContent = true;
      state!.lastWasSeparator = false;
    }
  };

  element.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const content = inPre
        ? (node.textContent ?? "")
        : (node.textContent ?? "").replace(/\s+/g, " ");
      if (content) pushSegment(content, inPre, Boolean(content.trim()));
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tagName = el.tagName.toUpperCase();

      if (tagName === "EPUB2TXT-SEP") {
        if (state!.hasContent && !state!.lastWasSeparator) {
          segments.push({ text: "\n\n---\n\n", pre: false });
          state!.lastWasSeparator = true;
        }
        return;
      }

      if (tagName === "BR") {
        pushSegment("\n", inPre);
        return;
      }

      if (tagName === "SCRIPT") {
        const type = (el.getAttribute("type") || "").toLowerCase();
        if (type.includes("math/tex") || type.includes("math/latex")) {
          const latex = (el.textContent || "").trim();
          if (latex) {
            const isBlock = type.includes("mode=display");
            if (!inPre && isBlock) pushSegment("\n", false);
            const wrapped = isBlock ? `$$${latex}$$` : `$${latex}$`;
            pushSegment(wrapped, false, true);
            if (!inPre && isBlock) pushSegment("\n", false);
          }
        }
        return;
      }

      if (tagName === "MATH") {
        const latex = getMathAnnotationLatex(el);
        const isBlock = isMathBlock(el);
        if (latex) {
          if (!inPre && isBlock) pushSegment("\n", false);
          pushSegment(isBlock ? `$$${latex}$$` : `$${latex}$`, false, true);
          if (!inPre && isBlock) pushSegment("\n", false);
          return;
        }
        if (isBlock && !inPre) pushSegment("\n", false);
        collectTextSegments(el, inPre, segments, state, listDepth);
        if (isBlock && !inPre) pushSegment("\n", false);
        return;
      }

      if (tagName === "IMG") {
        const altText =
          el.getAttribute("alt") ||
          el.getAttribute("aria-label") ||
          el.getAttribute("title") ||
          "";
        const isMathImg =
          isMathLikeClass(el) ||
          looksLikeLatex(altText) ||
          el.getAttribute("role") === "math";
        if (altText && isMathImg) {
          const isBlock = isMathBlock(el);
          if (!inPre && isBlock) pushSegment("\n", false);
          pushSegment(`[MATH: ${altText.trim()}]`, false, true);
          if (!inPre && isBlock) pushSegment("\n", false);
          return;
        }
        return;
      }

      // Bold
      if (tagName === "B" || tagName === "STRONG") {
        if (!inPre) pushSegment("**", false);
        collectTextSegments(el, inPre, segments, state, listDepth);
        if (!inPre) pushSegment("**", false);
        return;
      }

      // Lists
      if (tagName === "UL" || tagName === "OL") {
        if (!inPre) pushSegment("\n", false);
        collectTextSegments(el, inPre, segments, state, listDepth + 1);
        if (!inPre) pushSegment("\n", false);
        return;
      }

      if (tagName === "LI") {
        if (!inPre) {
          pushSegment("\n", false);
          const indent = "  ".repeat(Math.max(0, listDepth - 1));
          pushSegment(indent + "- ", true);
        }
        collectTextSegments(el, inPre, segments, state, listDepth);
        if (!inPre) pushSegment("\n", false);
        return;
      }

      // Headings
      const headingLevel = HEADING_TAGS[tagName];
      if (headingLevel && !inPre) {
        const headingText = (el.textContent || "").replace(/\s+/g, " ").trim();
        if (headingText) {
          const level = Math.min(headingLevel, MAX_HEADING_LEVEL);
          pushSegment("\n", false);
          pushSegment(`${"#".repeat(level)} ${headingText}`, false, true);
          pushSegment("\n", false);
          return;
        }
      }

      // Block tags
      const isBlock = BLOCK_TAGS.has(tagName);
      const nextPre = inPre || PRE_TAGS.has(tagName);
      if (isBlock && !inPre) pushSegment("\n", false);
      collectTextSegments(el, nextPre, segments, state, listDepth);
      if (isBlock && !inPre) pushSegment("\n", false);
    }
  });

  return segments;
}

/**
 * Convert a DOM parsed XHTML document to plain text.
 */
function documentToText(doc: Document): string {
  const segments = collectTextSegments(doc.body ?? doc.documentElement);
  let result = "";
  for (const seg of segments) {
    result += seg.text;
  }
  // Collapse 3+ consecutive newlines into 2
  return result.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Get all descendants matching a local name.
 */
function getElementsByLocalName(
  node: Document | Element,
  localName: string,
): Element[] {
  if (!node) return [];
  return Array.from(node.getElementsByTagNameNS("*", localName));
}

/**
 * Parse spine order from the OPF file and return hrefs in reading order.
 */
function parseOpfSpine(opfContent: string, opfDir: string): string[] {
  const parser = new DOMParser();
  const opfDoc = parser.parseFromString(opfContent, "application/xml");

  // Build manifest id → href map
  const manifestMap = new Map<string, string>();
  const manifestItems = getElementsByLocalName(opfDoc, "item");
  for (const item of manifestItems) {
    const id = item.getAttribute("id");
    const href = item.getAttribute("href");
    if (id && href) {
      // Resolve relative to OPF directory
      const resolved = opfDir ? `${opfDir}/${href}` : href;
      manifestMap.set(id, resolved);
    }
  }

  // Walk spine itemrefs in order
  const spineItems = getElementsByLocalName(opfDoc, "itemref");
  const orderedHrefs: string[] = [];
  for (const itemref of spineItems) {
    const idref = itemref.getAttribute("idref");
    if (idref && manifestMap.has(idref)) {
      orderedHrefs.push(manifestMap.get(idref)!);
    }
  }

  return orderedHrefs;
}

export class EpubConverterRepositoryImpl implements IEpubConverterRepository {
  async convertToTxt(epubArrayBuffer: ArrayBuffer): Promise<Blob> {
    const zip = await JSZip.loadAsync(epubArrayBuffer);

    // 1. Find the OPF file via META-INF/container.xml
    const containerXml = await zip
      .file("META-INF/container.xml")
      ?.async("string");
    if (!containerXml)
      throw new Error("Invalid EPUB: missing META-INF/container.xml");

    const containerDoc = new DOMParser().parseFromString(
      containerXml,
      "application/xml",
    );
    const rootfileEl = getElementsByLocalName(containerDoc, "rootfile")[0];
    if (!rootfileEl)
      throw new Error("Invalid EPUB: no rootfile in container.xml");

    const opfPath = rootfileEl.getAttribute("full-path");
    if (!opfPath)
      throw new Error("Invalid EPUB: rootfile has no full-path attribute");

    const opfDir = opfPath.includes("/")
      ? opfPath.substring(0, opfPath.lastIndexOf("/"))
      : "";

    // 2. Load OPF and parse spine
    const opfContent = await zip.file(opfPath)?.async("string");
    if (!opfContent)
      throw new Error(`Invalid EPUB: cannot read OPF at ${opfPath}`);

    const spineHrefs = parseOpfSpine(opfContent, opfDir);
    if (!spineHrefs.length) throw new Error("Invalid EPUB: spine is empty");

    // 3. Extract text from each spine item in order
    const xmlParser = new DOMParser();
    const textParts: string[] = [];

    for (const href of spineHrefs) {
      // Normalize path (handle ../ relative segments)
      const normalizedHref = normalizePath(href);
      const zipFile = zip.file(normalizedHref);
      if (!zipFile) continue;

      const htmlContent = await zipFile.async("string");
      const doc = xmlParser.parseFromString(
        htmlContent,
        "application/xhtml+xml",
      );

      // Skip parse errors
      const parserError = doc.querySelector("parsererror");
      if (parserError) {
        // Try as text/html fallback
        const htmlDoc = new DOMParser().parseFromString(
          htmlContent,
          "text/html",
        );
        const text = documentToText(htmlDoc);
        if (text) textParts.push(text);
        continue;
      }

      const text = documentToText(doc);
      if (text) textParts.push(text);
    }

    const fullText = textParts.join("\n\n---\n\n");
    return new Blob([fullText], { type: "text/plain;charset=utf-8" });
  }
}

/**
 * Normalize a file path (resolve ../ segments).
 */
function normalizePath(path: string): string {
  const parts = path.split("/");
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === "..") {
      resolved.pop();
    } else if (part !== ".") {
      resolved.push(part);
    }
  }
  return resolved.join("/");
}
