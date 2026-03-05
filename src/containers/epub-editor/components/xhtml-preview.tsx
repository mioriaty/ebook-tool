"use client";

import { useRef, useEffect, useState } from "react";

interface XhtmlPreviewProps {
  content: string;
}

const DEBOUNCE_MS = 500;

export function XhtmlPreview({ content }: XhtmlPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [debouncedContent, setDebouncedContent] = useState(content);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContent(content);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [content]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(debouncedContent);
    doc.close();
  }, [debouncedContent]);

  return (
    <div className="h-full w-full border rounded-md overflow-hidden bg-white">
      <iframe
        ref={iframeRef}
        title="XHTML Preview"
        className="h-full w-full border-0"
        sandbox="allow-same-origin"
      />
    </div>
  );
}
