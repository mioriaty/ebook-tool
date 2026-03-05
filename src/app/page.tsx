import { EpubUploader } from "@/containers/epub-reader/components/epub-uploader";
import { BookLibrary } from "@/containers/epub-reader/components/book-library";

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ebook Tools</h1>
        <p className="text-muted-foreground mt-1">
          Upload EPUB files to your library. Read, edit metadata, modify
          chapters, convert formats, and check spelling.
        </p>
      </div>

      <EpubUploader />
      <BookLibrary />
    </div>
  );
}
