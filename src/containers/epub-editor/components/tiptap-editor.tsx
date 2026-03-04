"use client";

import { useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { EditorToolbar } from "./editor-toolbar";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  isReadOnly?: boolean;
}

function extractBodyContent(xhtml: string): string {
  const bodyMatch = xhtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch ? bodyMatch[1].trim() : xhtml;
}

function wrapInXhtml(bodyContent: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title></title>
</head>
<body>
${bodyContent}
</body>
</html>`;
}

export function TiptapEditor({
  content,
  onChange,
  isReadOnly = false,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: true }),
      Link.configure({ openOnClick: false }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: extractBodyContent(content),
    editable: !isReadOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(wrapInXhtml(html));
    },
  });

  useEffect(() => {
    if (editor && content) {
      const bodyContent = extractBodyContent(content);
      const currentContent = editor.getHTML();
      if (bodyContent !== currentContent) {
        editor.commands.setContent(bodyContent);
      }
    }
  }, [editor, content]);

  const handleSave = useCallback(() => {
    if (editor) {
      onChange(wrapInXhtml(editor.getHTML()));
    }
  }, [editor, onChange]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleSave]);

  if (!editor) return null;

  return (
    <div className="border rounded-lg overflow-hidden">
      {!isReadOnly && <EditorToolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[60vh] focus:outline-none [&_.ProseMirror]:min-h-[60vh] [&_.ProseMirror]:outline-none"
      />
    </div>
  );
}
