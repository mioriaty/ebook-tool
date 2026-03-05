"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  FileText,
  Library,
  PenTool,
  RefreshCw,
  SpellCheck,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEpubContext } from "./epub-context";

const NAV_ITEMS = [
  { href: "/", label: "Library", icon: Library },
  { href: "/reader", label: "Reader", icon: BookOpen, requiresBook: true },
  { href: "/metadata", label: "Metadata", icon: FileText, requiresBook: true },
  { href: "/editor", label: "Editor", icon: PenTool, requiresBook: true },
  { href: "/converter", label: "Convert", icon: RefreshCw, requiresBook: true },
  {
    href: "/spellcheck",
    label: "Spell Check",
    icon: SpellCheck,
    requiresBook: true,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { currentBook, setCurrentBook, library } = useEpubContext();

  const handleBookSwitch = (sessionId: string) => {
    const book = library.find((b) => b.sessionId === sessionId);
    if (book) {
      setCurrentBook(book);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <span className="font-semibold text-lg">Ebook Tools</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {currentBook && library.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Selected Book</SidebarGroupLabel>
            <SidebarGroupContent>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full px-2 py-2 rounded-md hover:bg-accent text-left flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {currentBook.metadata.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {currentBook.metadata.creators.join(", ") ||
                        "Unknown author"}
                    </p>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {library.map((book) => (
                    <DropdownMenuItem
                      key={book.sessionId}
                      onClick={() => handleBookSwitch(book.sessionId)}
                      className="flex items-center gap-2"
                    >
                      {book.sessionId === currentBook.sessionId ? (
                        <Check className="h-4 w-4 shrink-0" />
                      ) : (
                        <div className="w-4" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate">
                          {book.metadata.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {book.metadata.creators.join(", ")}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isDisabled = item.requiresBook && !currentBook;
                const isActive = pathname === item.href;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild={!isDisabled}
                      isActive={isActive}
                      disabled={isDisabled}
                      tooltip={isDisabled ? "Select a book first" : item.label}
                    >
                      {isDisabled ? (
                        <span className="opacity-50 flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </span>
                      ) : (
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
