# Ebook Tool

A Calibre-like web application built with Next.js for managing, reading, editing, and converting EPUB files. Manage an entire EPUB library from your browser.

## Features

### 1. Library Management

- Upload multiple EPUB files at once via drag-and-drop or file picker
- Persistent library stored on disk (survives page refresh)
- Grid dashboard displaying all books with title, author, language, chapter count, and upload date
- Quick actions per book: Read, Edit Metadata, Edit Chapters, Convert, Spell Check
- Context menu with full action list and delete option
- Switch between books instantly via the sidebar dropdown
- Remove books from the library

### 2. EPUB Reader

- Render and read EPUB directly in the browser
- Navigate between chapters
- Adjust font size (zoom in/out)
- Responsive reading experience

### 3. Metadata Editor

- View and edit book metadata: title, author(s), language, publisher, date, description, subjects, rights
- View, replace, or add cover image
- Save changes back to the EPUB file
- Download the modified EPUB

### 4. Chapter Editor

- Browse all chapters via a sidebar navigator
- Edit chapter content using a rich text editor (TipTap) with toolbar support:
  - Bold, Italic, Underline, Strikethrough, Code
  - Headings (H1, H2, H3)
  - Bullet list, Ordered list, Blockquote, Horizontal rule
  - Text alignment (left, center, right)
  - Insert links and images
  - Undo / Redo
- Save edited chapters back to the EPUB
- Download the modified EPUB
- Keyboard shortcut: `Ctrl+S` / `Cmd+S` to save

### 5. Format Converter

- Convert EPUB to other formats using Calibre CLI:
  - AZW3 (Kindle)
  - MOBI (Kindle Legacy)
  - PDF
  - DOCX (Word)
  - Plain Text
  - HTML (Zipped)
- Configure conversion options: base font size, margins
- Auto-download converted file

### 6. Spell Checker

- Check spelling across all chapters
- Support for English and Vietnamese
- Auto-detect language from EPUB metadata
- Display misspelled words with context
- Show spelling suggestions for each error
- Results grouped by chapter

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | Shadcn UI, Radix UI, Tailwind CSS |
| EPUB Rendering | epubjs, react-reader |
| EPUB Parsing | JSZip, fast-xml-parser |
| Rich Text Editor | TipTap (ProseMirror) |
| Format Conversion | Calibre CLI (`ebook-convert`) |
| Spell Check | typo-js (Hunspell dictionaries) |
| Data Fetching | TanStack Query |
| State Management | React Context, nuqs |

## Architecture

The project follows **Clean Architecture** with a feature-first organization:

```
src/
├── core/                    # Business logic (domain + use cases + factories)
│   ├── epub-reader/
│   ├── epub-metadata/
│   ├── epub-editor/
│   ├── epub-converter/
│   └── spell-checker/
├── containers/              # UI + Infrastructure (components, hooks, repo impls)
│   ├── epub-reader/
│   ├── epub-metadata/
│   ├── epub-editor/
│   ├── epub-converter/
│   ├── spell-checker/
│   └── shared/
├── libs/
│   ├── epub/                # EPUB parser, session store & library persistence
│   └── api/                 # HTTP fetch client
├── shared/types/            # Shared TypeScript types
└── app/                     # Next.js pages & API routes
```

## Prerequisites

- **Node.js** >= 18
- **Calibre** (required for format conversion only)

```bash
# macOS
brew install calibre

# Ubuntu/Debian
sudo apt install calibre
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:8386](http://localhost:8386) in your browser.

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/epub/library` | GET | List all books in the library |
| `/api/epub/library` | DELETE | Remove a book from the library |
| `/api/epub/upload` | POST | Upload and parse an EPUB file |
| `/api/epub/[id]/metadata` | GET | Get book metadata and chapter list |
| `/api/epub/[id]/metadata` | PUT | Update metadata or cover image |
| `/api/epub/[id]/chapters` | GET | List all chapters |
| `/api/epub/[id]/chapters/[idx]` | GET | Get chapter content |
| `/api/epub/[id]/chapters/[idx]` | PUT | Update chapter content |
| `/api/epub/[id]/download` | GET | Download the EPUB file |
| `/api/epub/[id]/convert` | POST | Convert to another format |
| `/api/epub/[id]/spellcheck` | POST | Run spell check |
