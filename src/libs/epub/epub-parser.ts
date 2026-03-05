import JSZip from "jszip";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import type {
  EpubMetadata,
  EpubChapter,
  EpubEditableFile,
  EpubManifestItem,
  EpubSpineItem,
  EpubToc,
} from "@/shared/types/epub";

const XML_PARSE_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name: string) => {
    const arrayTags = [
      "item",
      "itemref",
      "dc:creator",
      "dc:subject",
      "navPoint",
      "reference",
    ];
    return arrayTags.includes(name);
  },
};

const XML_BUILD_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  format: true,
  suppressEmptyNode: false,
};

export class EpubParser {
  private zip: JSZip;
  private opfPath: string = "";
  private opfDir: string = "";
  private opfContent: Record<string, unknown> = {};

  constructor(private buffer: ArrayBuffer) {
    this.zip = new JSZip();
  }

  async parse(): Promise<void> {
    await this.zip.loadAsync(this.buffer);
    await this.findOpfPath();
    await this.parseOpf();
  }

  private async findOpfPath(): Promise<void> {
    const containerXml = await this.zip
      .file("META-INF/container.xml")
      ?.async("text");
    if (!containerXml) throw new Error("Invalid EPUB: missing container.xml");

    const parser = new XMLParser(XML_PARSE_OPTIONS);
    const container = parser.parse(containerXml);
    const rootfile = container.container?.rootfiles?.rootfile;
    const rootfileEntry = Array.isArray(rootfile) ? rootfile[0] : rootfile;
    this.opfPath = rootfileEntry?.["@_full-path"] || "";
    if (!this.opfPath) throw new Error("Invalid EPUB: cannot find OPF path");

    const lastSlash = this.opfPath.lastIndexOf("/");
    this.opfDir =
      lastSlash >= 0 ? this.opfPath.substring(0, lastSlash + 1) : "";
  }

  private async parseOpf(): Promise<void> {
    const opfXml = await this.zip.file(this.opfPath)?.async("text");
    if (!opfXml) throw new Error("Invalid EPUB: missing OPF file");

    const parser = new XMLParser(XML_PARSE_OPTIONS);
    this.opfContent = parser.parse(opfXml);
  }

  private getPackage(): Record<string, unknown> {
    return (this.opfContent["package"] ||
      this.opfContent["opf:package"] ||
      {}) as Record<string, unknown>;
  }

  private getDcMetadata(): Record<string, unknown> {
    const pkg = this.getPackage();
    const metadata = (pkg["metadata"] || pkg["opf:metadata"] || {}) as Record<
      string,
      unknown
    >;
    return metadata;
  }

  getMetadata(sessionId: string): EpubMetadata {
    const dc = this.getDcMetadata();

    const getTextValue = (val: unknown): string => {
      if (!val) return "";
      if (typeof val === "string") return val;
      if (typeof val === "object" && val !== null && "#text" in val)
        return String((val as Record<string, unknown>)["#text"]);
      return String(val);
    };

    const getArrayValue = (val: unknown): string[] => {
      if (!val) return [];
      const items = Array.isArray(val) ? val : [val];
      return items.map(getTextValue).filter(Boolean);
    };

    const coverMeta = this.findCoverImageId();
    const coverImagePath = coverMeta
      ? this.resolveHref(this.getManifestItemById(coverMeta)?.href || "")
      : null;

    return {
      id: sessionId,
      title: getTextValue(dc["dc:title"]),
      creators: getArrayValue(dc["dc:creator"]),
      language: getTextValue(dc["dc:language"]),
      publisher: getTextValue(dc["dc:publisher"]),
      date: getTextValue(dc["dc:date"]),
      description: getTextValue(dc["dc:description"]),
      identifier: getTextValue(dc["dc:identifier"]),
      subjects: getArrayValue(dc["dc:subject"]),
      rights: getTextValue(dc["dc:rights"]),
      coverImagePath,
    };
  }

  private findCoverImageId(): string | null {
    const dc = this.getDcMetadata();
    const metaEntries = dc["meta"];
    if (!metaEntries) return null;

    const metas = Array.isArray(metaEntries) ? metaEntries : [metaEntries];
    for (const m of metas) {
      if (
        typeof m === "object" &&
        m !== null &&
        (m as Record<string, string>)["@_name"] === "cover"
      ) {
        return (m as Record<string, string>)["@_content"] || null;
      }
    }

    const manifestItems = this.getManifestItems();
    const coverItem = manifestItems.find(
      (item) =>
        item.id === "cover-image" ||
        item.id === "cover" ||
        (item.mediaType.startsWith("image/") &&
          item.href.toLowerCase().includes("cover"))
    );
    return coverItem?.id || null;
  }

  private getManifestItemById(id: string): EpubManifestItem | undefined {
    return this.getManifestItems().find((item) => item.id === id);
  }

  getManifestItems(): EpubManifestItem[] {
    const pkg = this.getPackage();
    const manifest = (pkg["manifest"] as Record<string, unknown>) || {};
    const items = manifest["item"];
    if (!items) return [];

    const itemArr = Array.isArray(items) ? items : [items];
    return itemArr.map((item: Record<string, string>) => ({
      id: item["@_id"] || "",
      href: item["@_href"] || "",
      mediaType: item["@_media-type"] || "",
    }));
  }

  getSpineItems(): EpubSpineItem[] {
    const pkg = this.getPackage();
    const spine = (pkg["spine"] as Record<string, unknown>) || {};
    const items = spine["itemref"];
    if (!items) return [];

    const itemArr = Array.isArray(items) ? items : [items];
    return itemArr.map((item: Record<string, string>) => ({
      idref: item["@_idref"] || "",
      linear: item["@_linear"] !== "no",
    }));
  }

  getChapters(): EpubChapter[] {
    const spineItems = this.getSpineItems();
    const manifestItems = this.getManifestItems();

    return spineItems
      .map((spine, index) => {
        const manifest = manifestItems.find((m) => m.id === spine.idref);
        if (!manifest) return null;
        return {
          id: spine.idref,
          href: manifest.href,
          title: manifest.id,
          order: index,
        };
      })
      .filter((ch): ch is EpubChapter => ch !== null);
  }

  getEditableFiles(): EpubEditableFile[] {
    const EDITABLE_TYPES: Record<string, "xhtml" | "css" | "other"> = {
      "application/xhtml+xml": "xhtml",
      "text/html": "xhtml",
      "text/css": "css",
      "application/x-dtbncx+xml": "other",
    };

    const manifestItems = this.getManifestItems();

    const files = manifestItems
      .filter((item) => item.mediaType in EDITABLE_TYPES)
      .map((item) => ({
        id: item.id,
        href: item.href,
        title: item.href.split("/").pop() || item.id,
        mediaType: item.mediaType,
        category: EDITABLE_TYPES[item.mediaType],
      }));

    const order: Record<string, number> = { xhtml: 0, css: 1, other: 2 };
    files.sort((a, b) => order[a.category] - order[b.category]);

    return files;
  }

  async getChapterContent(href: string): Promise<string> {
    const fullPath = this.opfDir + href;
    const content = await this.zip.file(fullPath)?.async("text");
    if (!content) throw new Error(`Chapter not found: ${href}`);
    return content;
  }

  async setChapterContent(href: string, content: string): Promise<void> {
    const fullPath = this.opfDir + href;
    this.zip.file(fullPath, content);
  }

  async getCoverImage(): Promise<Buffer | null> {
    const coverId = this.findCoverImageId();
    if (!coverId) return null;

    const manifest = this.getManifestItemById(coverId);
    if (!manifest) return null;

    const fullPath = this.opfDir + manifest.href;
    const data = await this.zip.file(fullPath)?.async("nodebuffer");
    return data || null;
  }

  getCoverMediaType(): string | null {
    const coverId = this.findCoverImageId();
    if (!coverId) return null;
    const manifest = this.getManifestItemById(coverId);
    return manifest?.mediaType || null;
  }

  async setCoverImage(imageBuffer: Buffer, mediaType: string): Promise<void> {
    const coverId = this.findCoverImageId();

    if (coverId) {
      const manifest = this.getManifestItemById(coverId);
      if (manifest) {
        const fullPath = this.opfDir + manifest.href;
        this.zip.file(fullPath, imageBuffer);
      }
    } else {
      const ext = mediaType.split("/")[1] || "jpg";
      const coverHref = `images/cover.${ext}`;
      const fullPath = this.opfDir + coverHref;
      this.zip.file(fullPath, imageBuffer);

      this.addManifestItem("cover-image", coverHref, mediaType);
      this.addCoverMeta("cover-image");
    }
  }

  updateMetadata(updates: Partial<EpubMetadata>): void {
    const pkg = this.getPackage();
    const metadata = (pkg["metadata"] || pkg["opf:metadata"] || {}) as Record<
      string,
      unknown
    >;

    if (updates.title !== undefined) metadata["dc:title"] = updates.title;
    if (updates.creators !== undefined) {
      metadata["dc:creator"] = updates.creators.map((c) => ({ "#text": c }));
    }
    if (updates.language !== undefined)
      metadata["dc:language"] = updates.language;
    if (updates.publisher !== undefined)
      metadata["dc:publisher"] = updates.publisher;
    if (updates.date !== undefined) metadata["dc:date"] = updates.date;
    if (updates.description !== undefined)
      metadata["dc:description"] = updates.description;
    if (updates.subjects !== undefined) {
      metadata["dc:subject"] = updates.subjects;
    }
    if (updates.rights !== undefined) metadata["dc:rights"] = updates.rights;

    const builder = new XMLBuilder(XML_BUILD_OPTIONS);
    const newOpfXml = builder.build(this.opfContent);
    this.zip.file(this.opfPath, newOpfXml);
  }

  private addManifestItem(id: string, href: string, mediaType: string): void {
    const pkg = this.getPackage();
    const manifest = (pkg["manifest"] as Record<string, unknown>) || {};
    const items = manifest["item"] as Record<string, string>[];
    const newItem = {
      "@_id": id,
      "@_href": href,
      "@_media-type": mediaType,
    };
    if (Array.isArray(items)) {
      items.push(newItem);
    } else {
      manifest["item"] = [items, newItem].filter(Boolean);
    }
  }

  private addCoverMeta(coverId: string): void {
    const dc = this.getDcMetadata();
    const meta = dc["meta"];
    const newMeta = { "@_name": "cover", "@_content": coverId };
    if (Array.isArray(meta)) {
      meta.push(newMeta);
    } else if (meta) {
      dc["meta"] = [meta, newMeta];
    } else {
      dc["meta"] = newMeta;
    }
  }

  resolveHref(href: string): string {
    return this.opfDir + href;
  }

  async getFileContent(path: string): Promise<Buffer | null> {
    const data = await this.zip.file(path)?.async("nodebuffer");
    return data || null;
  }

  async toBuffer(): Promise<Buffer> {
    const buffer = await this.zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
      mimeType: "application/epub+zip",
    });
    return buffer;
  }

  async getToc(): Promise<EpubToc[]> {
    const ncxItem = this.getManifestItems().find(
      (item) =>
        item.mediaType === "application/x-dtbncx+xml" ||
        item.id === "ncx" ||
        item.id === "toc"
    );

    if (ncxItem) {
      return this.parseTocNcx(ncxItem.href);
    }

    const navItem = this.getManifestItems().find(
      (item) =>
        item.mediaType === "application/xhtml+xml" &&
        item.id.toLowerCase().includes("nav")
    );

    if (navItem) {
      return this.parseTocNav(navItem.href);
    }

    return this.getChapters().map((ch) => ({
      id: ch.id,
      href: ch.href,
      label: ch.title,
      children: [],
    }));
  }

  private async parseTocNcx(href: string): Promise<EpubToc[]> {
    const fullPath = this.opfDir + href;
    const xml = await this.zip.file(fullPath)?.async("text");
    if (!xml) return [];

    const parser = new XMLParser(XML_PARSE_OPTIONS);
    const ncx = parser.parse(xml);
    const navMap = ncx?.ncx?.navMap;
    if (!navMap) return [];

    const parseNavPoints = (points: unknown): EpubToc[] => {
      if (!points) return [];
      const arr = Array.isArray(points) ? points : [points];
      return arr.map((point: Record<string, unknown>) => {
        const label =
          typeof point.navLabel === "object" && point.navLabel !== null
            ? String((point.navLabel as Record<string, unknown>).text || "")
            : "";
        const content = point.content as Record<string, string> | undefined;
        return {
          id: String(point["@_id"] || ""),
          href: content?.["@_src"] || "",
          label,
          children: parseNavPoints(point.navPoint),
        };
      });
    };

    return parseNavPoints(navMap.navPoint);
  }

  private async parseTocNav(href: string): Promise<EpubToc[]> {
    const fullPath = this.opfDir + href;
    const xml = await this.zip.file(fullPath)?.async("text");
    if (!xml) return [];

    const chapters = this.getChapters();
    return chapters.map((ch) => ({
      id: ch.id,
      href: ch.href,
      label: ch.title,
      children: [],
    }));
  }

  getZip(): JSZip {
    return this.zip;
  }
}
