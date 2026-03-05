"use client";

import { useRef, useEffect, useCallback, useLayoutEffect } from "react";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  rectangularSelection,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  defaultKeymap,
  indentWithTab,
  history,
  historyKeymap,
} from "@codemirror/commands";
import {
  bracketMatching,
  foldGutter,
  indentOnInput,
  syntaxHighlighting,
  defaultHighlightStyle,
} from "@codemirror/language";
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { useTheme } from "next-themes";

interface XhtmlCodeEditorProps {
  content: string;
  onChange: (value: string) => void;
  language?: "html" | "css";
  wordWrap?: boolean;
  wordWrapColumn?: number;
}

export function XhtmlCodeEditor({
  content,
  onChange,
  language = "html",
  wordWrap = true,
  wordWrapColumn = 120,
}: XhtmlCodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const { resolvedTheme } = useTheme();

  useLayoutEffect(() => {
    onChangeRef.current = onChange;
  });

  const createExtensions = useCallback(
    (isDark: boolean, lang: "html" | "css", wrap: boolean, wrapCol: number) => [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      drawSelection(),
      rectangularSelection(),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      foldGutter(),
      autocompletion(),
      highlightSelectionMatches(),
      ...(lang === "css" ? [css()] : [html({ selfClosingTags: true })]),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      ...(isDark ? [oneDark] : []),
      ...(wrap ? [EditorView.lineWrapping] : []),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...closeBracketsKeymap,
        ...completionKeymap,
        ...searchKeymap,
        indentWithTab,
      ]),
      history(),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString());
        }
      }),
      EditorView.theme({
        "&": { height: "100%", fontSize: "13px" },
        ".cm-scroller": { overflow: "auto" },
        ".cm-content": {
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          ...(wrap && { maxWidth: `${wrapCol}ch` }),
        },
        ".cm-gutters": {
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        },
      }),
    ],
    []
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const isDark = resolvedTheme === "dark";

    const state = EditorState.create({
      doc: content,
      extensions: createExtensions(isDark, language, wordWrap, wordWrapColumn),
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [resolvedTheme, language, wordWrap, wordWrapColumn, createExtensions]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentDoc = view.state.doc.toString();
    if (content !== currentDoc) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentDoc.length,
          insert: content,
        },
      });
    }
  }, [content]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden border rounded-md [&_.cm-editor]:h-full"
    />
  );
}
