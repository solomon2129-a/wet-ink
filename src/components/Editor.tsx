"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { createPortal } from "react-dom";

interface EditorProps {
  content: string;
  onContentChange: (html: string) => void;
}

interface ToolbarPos {
  top: number;
  left: number;
}

export function Editor({ content, onContentChange }: EditorProps) {
  const initialized = useRef(false);
  const [toolbarPos, setToolbarPos] = useState<ToolbarPos | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Begin your story…" }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
    editorProps: {
      attributes: { class: "tiptap-editor" },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && content && !initialized.current) {
      initialized.current = true;
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  const updateToolbar = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setToolbarPos(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0) {
      setToolbarPos(null);
      return;
    }
    const toolbarW = 192; // approximate width
    const x = rect.left + rect.width / 2 - toolbarW / 2;
    const y = rect.top + window.scrollY - 48;
    setToolbarPos({ top: y, left: Math.max(8, x) });
  }, []);

  useEffect(() => {
    if (!editor) return;
    editor.on("selectionUpdate", updateToolbar);
    editor.on("blur", () => setToolbarPos(null));
    return () => {
      editor.off("selectionUpdate", updateToolbar);
    };
  }, [editor, updateToolbar]);

  const buttons = editor
    ? [
        {
          label: "B",
          action: () => editor.chain().focus().toggleBold().run(),
          active: editor.isActive("bold"),
          title: "Bold",
          extra: { fontWeight: 700 },
        },
        {
          label: "I",
          action: () => editor.chain().focus().toggleItalic().run(),
          active: editor.isActive("italic"),
          title: "Italic",
          extra: { fontStyle: "italic" },
        },
        {
          label: "H1",
          action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          active: editor.isActive("heading", { level: 1 }),
          title: "Heading 1",
          extra: {},
        },
        {
          label: "H2",
          action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          active: editor.isActive("heading", { level: 2 }),
          title: "Heading 2",
          extra: {},
        },
        {
          label: `"`,
          action: () => editor.chain().focus().toggleBlockquote().run(),
          active: editor.isActive("blockquote"),
          title: "Quote",
          extra: { fontFamily: "Georgia, serif", fontSize: "15px" },
        },
      ]
    : [];

  return (
    <div className="relative">
      <EditorContent editor={editor} />

      {/* Floating toolbar — portalled to body so it clears overflow:hidden */}
      {toolbarPos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={toolbarRef}
            style={{
              position: "absolute",
              top: toolbarPos.top,
              left: toolbarPos.left,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              gap: "2px",
              padding: "6px 6px",
              borderRadius: "12px",
              background: "#16161c",
              border: "1px solid #2a2a38",
              boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)",
              backdropFilter: "blur(16px)",
              pointerEvents: "auto",
            }}
            // Prevent the toolbar clicks from collapsing the selection
            onMouseDown={(e) => e.preventDefault()}
          >
            {buttons.map((btn, i) => (
              <button
                key={i}
                onClick={btn.action}
                title={btn.title}
                style={{
                  width: "30px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "Georgia, serif",
                  cursor: "pointer",
                  background: btn.active ? "rgba(201,169,110,0.18)" : "transparent",
                  color: btn.active ? "#c9a96e" : "#7a7a8a",
                  border: btn.active
                    ? "1px solid rgba(201,169,110,0.3)"
                    : "1px solid transparent",
                  transition: "all 0.12s ease",
                  ...btn.extra,
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
