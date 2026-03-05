"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEpubContext } from "@/containers/shared/components/epub-context";
import { useDeleteBook } from "../hooks/use-library";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  FileText,
  PenTool,
  RefreshCw,
  SpellCheck,
  MoreHorizontal,
  Trash2,
  Library,
  ArrowUpDown,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import type { EpubFile } from "@/shared/types/epub";

function ActionsCell({ book }: { book: EpubFile }) {
  const router = useRouter();
  const { setCurrentBook, currentBook } = useEpubContext();
  const deleteMutation = useDeleteBook();

  const selectAndNavigate = (path: string) => {
    setCurrentBook(book);
    router.push(path);
  };

  const handleDelete = async () => {
    if (currentBook?.sessionId === book.sessionId) {
      setCurrentBook(null);
    }
    try {
      await deleteMutation.mutateAsync(book.sessionId);
      toast.success(`"${book.metadata.title}" removed`);
    } catch {
      toast.error("Failed to delete book");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => selectAndNavigate("/reader")}>
          <BookOpen className="h-4 w-4 mr-2" />
          Read
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => selectAndNavigate("/metadata")}>
          <FileText className="h-4 w-4 mr-2" />
          Edit Metadata
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => selectAndNavigate("/editor")}>
          <PenTool className="h-4 w-4 mr-2" />
          Edit Chapters
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => selectAndNavigate("/converter")}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Convert
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => selectAndNavigate("/spellcheck")}>
          <SpellCheck className="h-4 w-4 mr-2" />
          Spell Check
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TitleCell({ book }: { book: EpubFile }) {
  const router = useRouter();
  const { setCurrentBook, currentBook } = useEpubContext();
  const isSelected = currentBook?.sessionId === book.sessionId;

  return (
    <button
      className="text-left hover:underline font-medium"
      onClick={() => {
        setCurrentBook(book);
        router.push("/reader");
      }}
    >
      <span>{book.metadata.title || "Untitled"}</span>
      {isSelected && (
        <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
          active
        </Badge>
      )}
    </button>
  );
}

const columns: ColumnDef<EpubFile>[] = [
  {
    accessorFn: (row) => row.metadata.title,
    id: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Title
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <TitleCell book={row.original} />,
  },
  {
    accessorFn: (row) => row.metadata.creators.join(", "),
    id: "author",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Author
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">
        {(getValue() as string) || "Unknown"}
      </span>
    ),
  },
  {
    accessorFn: (row) => row.metadata.language,
    id: "language",
    header: "Language",
    cell: ({ getValue }) => {
      const lang = getValue() as string;
      return lang ? (
        <Badge variant="outline" className="text-xs">
          {lang.toUpperCase()}
        </Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorFn: (row) => row.chapters.length,
    id: "chapters",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Chapters
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ getValue }) => (
      <span className="tabular-nums">{getValue() as number}</span>
    ),
  },
  {
    accessorKey: "addedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Added
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ getValue }) => {
      const val = getValue() as string;
      return val ? (
        <span className="text-muted-foreground text-sm">
          {new Date(val).toLocaleDateString()}
        </span>
      ) : (
        "-"
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell book={row.original} />,
  },
];

function LibrarySkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-64" />
      <div className="border rounded-md">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BookLibrary() {
  "use no memo";
  const { library, isLibraryLoading } = useEpubContext();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data: library,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
  });

  if (isLibraryLoading) {
    return <LibrarySkeleton />;
  }

  if (library.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Library className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Your library is empty</p>
        <p className="text-xs mt-1">Upload EPUB files to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Library ({library.length} {library.length === 1 ? "book" : "books"})
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(e) =>
              table.getColumn("title")?.setFilterValue(e.target.value)
            }
            className="pl-9"
          />
        </div>
        <div className="relative max-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by author..."
            value={
              (table.getColumn("author")?.getFilterValue() as string) ?? ""
            }
            onChange={(e) =>
              table.getColumn("author")?.setFilterValue(e.target.value)
            }
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
