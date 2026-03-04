import { EpubUploader } from "@/containers/epub-reader/components/epub-uploader";
import { BookInfo } from "@/containers/epub-reader/components/book-info";

export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ebook Tool</h1>
        <p className="text-muted-foreground mt-1">
          Upload an EPUB file to read, edit metadata, modify chapters, convert
          formats, and check spelling.
        </p>
      </div>

      <EpubUploader />
      <BookInfo />
    </div>
  );
}
