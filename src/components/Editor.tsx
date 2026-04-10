"use client";

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { createPortal } from "react-dom";
import { useState } from "react";

export interface EditorHandle {
  getHeadings: () => { id: string; text: string; el: Element; indent: number }[];
  scrollToHeading: (id: string) => void;
  scrollToBottom: () => void;
}

interface EditorProps {
  content: string;
  onContentChange: (html: string) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

interface ToolbarPos {
  top: number;
  left: number;
}

const Editor = forwardRef<EditorHandle, EditorProps>(
  ({ content, onContentChange, scrollContainerRef }, ref) => {
    const initialized = useRef(false);
    const [toolbarPos, setToolbarPos] = useState<ToolbarPos | null>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editorWrapRef = useRef<HTMLDivElement>(null);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        Placeholder.configure({ placeholder: "Begin your story…" }),
        Image.configure({ inline: false, allowBase64: true }),
      ],
      content,
      onUpdate: ({ editor }) => {
        onContentChange(editor.getHTML());
      },
      editorProps: {
        attributes: { class: "tiptap-editor" },
        handlePaste(view, event) {
          const items = event.clipboardData?.items;
          if (!items) return false;
          for (const item of Array.from(items)) {
            if (item.type.startsWith("image/")) {
              const file = item.getAsFile();
              if (!file) continue;
              const reader = new FileReader();
              reader.onload = (e) => {
                const src = e.target?.result as string;
                if (src) view.dispatch(view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.image.create({ src })
                ));
              };
              reader.readAsDataURL(file);
              return true;
            }
          }
          return false;
        },
      },
      immediatelyRender: false,
    });

    useImperativeHandle(ref, () => ({
      getHeadings() {
        if (!editorWrapRef.current) return [];
        const els = editorWrapRef.current.querySelectorAll("h1, h2, h3");
        return Array.from(els).map((el, i) => {
          const id = `heading-${i}`;
          el.setAttribute("data-heading-id", id);
          const tag = el.tagName.toLowerCase();
          const indent = tag === "h1" ? 0 : tag === "h2" ? 1 : 2;
          return { id, text: el.textContent || "Untitled chapter", el, indent };
        });
      },
      scrollToHeading(id: string) {
        if (!editorWrapRef.current || !scrollContainerRef.current) return;
        const el = editorWrapRef.current.querySelector(`[data-heading-id="${id}"]`);
        if (el) {
          const container = scrollContainerRef.current;
          const elTop = (el as HTMLElement).offsetTop;
          container.scrollTo({ top: elTop - 80, behavior: "smooth" });
        }
      },
      scrollToBottom() {
        if (!scrollContainerRef.current) return;
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      },
    }));

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
      if (rect.width === 0) { setToolbarPos(null); return; }
      const toolbarW = 200;
      const x = rect.left + rect.width / 2 - toolbarW / 2;
      const y = rect.top + window.scrollY - 52;
      setToolbarPos({ top: y, left: Math.max(8, Math.min(x, window.innerWidth - toolbarW - 8)) });
    }, []);

    useEffect(() => {
      if (!editor) return;
      editor.on("selectionUpdate", updateToolbar);
      editor.on("blur", () => setToolbarPos(null));
      return () => { editor.off("selectionUpdate", updateToolbar); };
    }, [editor, updateToolbar]);

    const insertImage = useCallback((file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        if (src && editor) editor.chain().focus().setImage({ src }).run();
      };
      reader.readAsDataURL(file);
    }, [editor]);

    const buttons = editor ? [
      {
        label: "B",
        action: () => editor.chain().focus().toggleBold().run(),
        active: editor.isActive("bold"),
        title: "Bold",
        style: { fontWeight: 700 },
      },
      {
        label: "I",
        action: () => editor.chain().focus().toggleItalic().run(),
        active: editor.isActive("italic"),
        title: "Italic",
        style: { fontStyle: "italic" },
      },
      {
        label: "H",
        action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        active: editor.isActive("heading", { level: 1 }),
        title: "Chapter heading",
        style: { fontWeight: 700, letterSpacing: "0.02em" },
      },
      {
        label: `"`,
        action: () => editor.chain().focus().toggleBlockquote().run(),
        active: editor.isActive("blockquote"),
        title: "Quote",
        style: { fontFamily: "Georgia, serif", fontSize: "15px" },
      },
      {
        label: "IMG",
        action: () => fileInputRef.current?.click(),
        active: false,
        title: "Insert image",
        style: { fontSize: "9px", letterSpacing: "0.04em", fontWeight: 600 },
      },
    ] : [];

    return (
      <div className="relative" ref={editorWrapRef}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) insertImage(file);
            e.target.value = "";
          }}
        />

        <EditorContent editor={editor} />

        {toolbarPos && typeof document !== "undefined" && createPortal(
          <div
            ref={toolbarRef}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              position: "absolute",
              top: toolbarPos.top,
              left: toolbarPos.left,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              gap: "2px",
              padding: "5px",
              borderRadius: "12px",
              background: "#13131a",
              border: "1px solid #2a2a38",
              boxShadow: "0 8px 32px rgba(0,0,0,0.75), 0 2px 8px rgba(0,0,0,0.5)",
              backdropFilter: "blur(20px)",
            }}
          >
            {buttons.map((btn, i) => (
              <button
                key={i}
                onClick={btn.action}
                title={btn.title}
                style={{
                  minWidth: "30px",
                  height: "28px",
                  padding: "0 6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "Georgia, serif",
                  cursor: "pointer",
                  background: btn.active ? "rgba(201,169,110,0.18)" : "transparent",
                  color: btn.active ? "#c9a96e" : "#7a7a8a",
                  border: btn.active ? "1px solid rgba(201,169,110,0.3)" : "1px solid transparent",
                  transition: "all 0.12s ease",
                  ...btn.style,
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
);

Editor.displayName = "Editor";
export { Editor };
