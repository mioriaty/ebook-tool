"use client";

import { useEpubContext } from "@/containers/shared/components/epub-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, PenTool, RefreshCw, SpellCheck } from "lucide-react";
import Link from "next/link";

const QUICK_ACTIONS = [
  { href: "/reader", label: "Read", icon: BookOpen },
  { href: "/metadata", label: "Metadata", icon: FileText },
  { href: "/editor", label: "Edit", icon: PenTool },
  { href: "/converter", label: "Convert", icon: RefreshCw },
  { href: "/spellcheck", label: "Spell Check", icon: SpellCheck },
];

export function BookInfo() {
  const { currentBook } = useEpubContext();

  if (!currentBook) return null;

  const { metadata, chapters } = currentBook;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Book Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Title</span>
            <p className="font-medium">{metadata.title}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Author(s)</span>
            <p className="font-medium">
              {metadata.creators.join(", ") || "Unknown"}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Language</span>
            <p className="font-medium">{metadata.language || "Unknown"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Chapters</span>
            <p className="font-medium">{chapters.length}</p>
          </div>
          {metadata.publisher && (
            <div>
              <span className="text-muted-foreground">Publisher</span>
              <p className="font-medium">{metadata.publisher}</p>
            </div>
          )}
          {metadata.subjects.length > 0 && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Subjects</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {metadata.subjects.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {QUICK_ACTIONS.map((action) => (
            <Button key={action.href} variant="outline" size="sm" asChild>
              <Link href={action.href}>
                <action.icon className="h-4 w-4 mr-1" />
                {action.label}
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
