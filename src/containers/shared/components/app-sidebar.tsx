"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  FileText,
  PenTool,
  RefreshCw,
  SpellCheck,
  Upload,
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
import { useEpubContext } from "./epub-context";

const NAV_ITEMS = [
  { href: "/", label: "Upload", icon: Upload },
  { href: "/reader", label: "Reader", icon: BookOpen, requiresBook: true },
  { href: "/metadata", label: "Metadata", icon: FileText, requiresBook: true },
  { href: "/editor", label: "Editor", icon: PenTool, requiresBook: true },
  { href: "/converter", label: "Convert", icon: RefreshCw, requiresBook: true },
  { href: "/spellcheck", label: "Spell Check", icon: SpellCheck, requiresBook: true },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { currentBook } = useEpubContext();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <span className="font-semibold text-lg">Ebook Tool</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
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
                      tooltip={
                        isDisabled
                          ? "Upload a book first"
                          : item.label
                      }
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

        {currentBook && (
          <SidebarGroup>
            <SidebarGroupLabel>Current Book</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-2 py-1">
                <p className="text-sm font-medium truncate">
                  {currentBook.metadata.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentBook.metadata.creators.join(", ") || "Unknown author"}
                </p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
