import { EpubUploader } from "@/containers/epub-reader/components/epub-uploader";
import { BookLibrary } from "@/containers/epub-reader/components/book-library";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ebook Tools</h1>
        <p className="text-muted-foreground mt-1">
          Upload EPUB files to your library. Read, edit metadata, modify
          chapters, convert formats, and check spelling.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <EpubUploader />
        </div>
        <div className="md:col-span-2">
          <BookLibrary />
        </div>
      </div>
    </div>
  );
}
