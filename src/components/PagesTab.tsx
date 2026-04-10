"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserBook, createBook, updateBook, countWords, Book } from "@/lib/firestore";
import { updateUserProfile } from "@/lib/firestore";
import { Editor, EditorHandle } from "./Editor";
import { ProfilePanel } from "./ProfilePanel";
import { Save, ArrowLeft, List, X, ChevronsDown } from "lucide-react";

const AUTOSAVE_INTERVAL = 5000;
const PINNED_EMAIL = "solomonsam2129@gmail.com";

type View = "cover" | "writing";

interface Heading { id: string; text: string; el: Element }

export function PagesTab() {
  const { user, profile, refreshProfile } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [title, setTitle] = useState("Untitled");
  const [authorName, setAuthorName] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(false);
  const [view, setView] = useState<View>("cover");
  const [isPublic, setIsPublic] = useState(true);
  const [togglingPublic, setTogglingPublic] = useState(false);
  const [showIndex, setShowIndex] = useState(false);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const latestContent = useRef<string>("");
  const bookRef = useRef<Book | null>(null);
  const titleRef = useRef("Untitled");
  const authorNameRef = useRef("");
  const isDirty = useRef(false);
  const editorRef = useRef<EditorHandle>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bookRef.current = book; }, [book]);
  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { authorNameRef.current = authorName; }, [authorName]);

  useEffect(() => {
    if (!user) return;
    getUserBook(user.uid).then((b) => {
      if (b) {
        setBook(b);
        setTitle(b.title);
        setAuthorName(b.authorName || profile?.username || "");
        setIsPublic(b.isPublic);
        latestContent.current = b.content || "";
      } else {
        setAuthorName(profile?.username || "");
        setIsPublic(profile?.isPublic ?? true);
      }
      setLoading(false);
    });
  }, [user, profile]);

  const persist = useCallback(async () => {
    if (!user || !isDirty.current) return;
    isDirty.current = false;
    setSaving(true);
    const html = latestContent.current;
    const wc = countWords(html);
    const t = titleRef.current;
    const an = authorNameRef.current;
    if (!bookRef.current) {
      const id = await createBook({
        userId: user.uid, userEmail: user.email || "",
        username: profile?.username || "writer",
        authorName: an || profile?.username || "writer",
        title: t, content: html, isPublic, wordCount: wc,
      });
      const nb: Book = {
        id, userId: user.uid, userEmail: user.email || "",
        username: profile?.username || "writer",
        authorName: an || profile?.username || "writer",
        title: t, content: html, isPublic, wordCount: wc,
      };
      setBook(nb); bookRef.current = nb;
    } else {
      await updateBook(bookRef.current.id, { content: html, wordCount: wc, title: t, authorName: an });
      setBook((b) => b ? { ...b, content: html, wordCount: wc, title: t, authorName: an } : b);
    }
    setSaving(false); setSavedAt(new Date());
  }, [user, profile, isPublic]);

  useEffect(() => {
    const t = setInterval(persist, AUTOSAVE_INTERVAL);
    return () => clearInterval(t);
  }, [persist]);

  const handleManualSave = async () => { isDirty.current = true; await persist(); };

  const togglePublic = async () => {
    const next = !isPublic;
    setIsPublic(next);
    setTogglingPublic(true);
    if (bookRef.current) await updateBook(bookRef.current.id, { isPublic: next });
    if (user) await updateUserProfile(user.uid, { isPublic: next });
    await refreshProfile();
    setTogglingPublic(false);
  };

  const saveTitle = (v: string) => { titleRef.current = v; setTitle(v); isDirty.current = true; };
  const saveAuthor = (v: string) => { authorNameRef.current = v; setAuthorName(v); isDirty.current = true; };

  const openIndex = () => {
    if (editorRef.current) setHeadings(editorRef.current.getHeadings());
    setShowIndex(true);
  };

  const jumpToHeading = (id: string) => {
    editorRef.current?.scrollToHeading(id);
    setShowIndex(false);
  };

  const jumpToBottom = () => editorRef.current?.scrollToBottom();

  // Track scroll to show/hide jump-to-bottom button
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottom(distFromBottom > 300);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll, view]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
      </div>
    );
  }

  /* ─── WRITING VIEW ─── */
  if (view === "writing") {
    return (
      <div className="flex flex-col h-full overflow-hidden relative">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)", background: "rgba(10,10,12,0.92)", backdropFilter: "blur(16px)" }}
        >
          <button
            onClick={() => setView("cover")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
            style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text2)" }}
          >
            <ArrowLeft size={13} />
            <span style={{ fontSize: "13px" }}>Cover</span>
          </button>

          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{
                background: saving ? "var(--accent)" : savedAt ? "#4a9e6a" : "var(--border)",
                boxShadow: saving ? "0 0 6px var(--accent)" : "none",
              }}
            />
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {saving ? "Saving…" : savedAt ? "Saved" : "Unsaved"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Index button */}
            <button
              onClick={openIndex}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              title="Chapter index"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)" }}
            >
              <List size={14} />
            </button>

            {/* Save */}
            <button
              onClick={handleManualSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text2)", fontSize: "13px" }}
            >
              <Save size={11} /> Save
            </button>

            {/* Avatar */}
            <button
              onClick={() => setShowProfile(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center font-semibold"
              style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)", color: "var(--accent)", fontSize: "13px" }}
            >
              {(profile?.username || user?.email || "W")[0].toUpperCase()}
            </button>
          </div>
        </div>

        {/* Scrollable writing area */}
        <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
          <div className="max-w-2xl mx-auto px-6 pt-8 pb-36">
            {/* Title */}
            {editingTitle ? (
              <input
                autoFocus value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => { setEditingTitle(false); saveTitle(title); }}
                onKeyDown={(e) => { if (e.key === "Enter") { setEditingTitle(false); saveTitle(title); } }}
                className="w-full bg-transparent outline-none mb-1"
                style={{ fontFamily: "Georgia, serif", fontSize: "clamp(1.4rem, 4vw, 2rem)", fontWeight: 700, color: "#f0f0f8", letterSpacing: "-0.02em", lineHeight: 1.3, borderBottom: "1px solid var(--accent)", paddingBottom: "3px" }}
              />
            ) : (
              <h1
                onClick={() => setEditingTitle(true)}
                className="cursor-text mb-1"
                style={{ fontFamily: "Georgia, serif", fontSize: "clamp(1.4rem, 4vw, 2rem)", fontWeight: 700, color: title === "Untitled" ? "var(--muted)" : "#f0f0f8", letterSpacing: "-0.02em", lineHeight: 1.3 }}
              >
                {title}
              </h1>
            )}

            {/* Author */}
            <div className="mb-8">
              {editingAuthor ? (
                <input
                  autoFocus value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  onBlur={() => { setEditingAuthor(false); saveAuthor(authorName); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { setEditingAuthor(false); saveAuthor(authorName); } }}
                  placeholder="Author name…"
                  className="bg-transparent outline-none"
                  style={{ color: "var(--accent)", fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "14px", borderBottom: "1px solid var(--accent)", paddingBottom: "1px", width: "200px" }}
                />
              ) : (
                <p
                  onClick={() => setEditingAuthor(true)}
                  className="cursor-text"
                  style={{ color: authorName ? "var(--accent)" : "var(--muted)", fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "14px", opacity: authorName ? 0.8 : 0.35 }}
                >
                  {authorName ? `by ${authorName}` : "tap to set author name"}
                </p>
              )}
            </div>

            <Editor
              ref={editorRef}
              content={book?.content || ""}
              onContentChange={(html) => { latestContent.current = html; isDirty.current = true; }}
              scrollContainerRef={scrollContainerRef}
            />
          </div>
        </div>

        {/* Jump to bottom — shows when scrolled up far from bottom */}
        {showScrollBottom && (
          <button
            onClick={jumpToBottom}
            className="absolute bottom-6 right-5 flex items-center gap-1.5 px-3 py-2 rounded-full transition-all"
            style={{
              background: "var(--surface2)",
              border: "1px solid var(--border2)",
              color: "var(--muted)",
              fontSize: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              backdropFilter: "blur(12px)",
            }}
          >
            <ChevronsDown size={14} />
            <span>End</span>
          </button>
        )}

        {/* Index / Chapter panel */}
        {showIndex && (
          <div
            className="absolute inset-0 z-50 flex"
            onClick={() => setShowIndex(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />

            {/* Panel slides in from left */}
            <div
              className="relative z-10 h-full flex flex-col"
              style={{
                width: "min(80vw, 300px)",
                background: "var(--surface)",
                borderRight: "1px solid var(--border2)",
                boxShadow: "4px 0 40px rgba(0,0,0,0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <h2 style={{ fontFamily: "Georgia, serif", fontSize: "16px", fontWeight: 700, color: "#f0f0f8" }}>
                    Index
                  </h2>
                  <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                    {headings.length} chapter{headings.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => setShowIndex(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--surface2)", color: "var(--muted)" }}
                >
                  <X size={13} />
                </button>
              </div>

              {/* Chapter list */}
              <div className="flex-1 overflow-y-auto py-3 px-3">
                {headings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
                    >
                      <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: "14px", color: "var(--muted)" }}>H</span>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--muted)", fontFamily: "Georgia, serif", fontStyle: "italic" }}>
                      No chapters yet.
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--muted)", opacity: 0.5, lineHeight: 1.5 }}>
                      Select text and tap H in the toolbar to mark a chapter heading.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {headings.map((h, i) => (
                      <button
                        key={h.id}
                        onClick={() => jumpToHeading(h.id)}
                        className="flex items-center gap-3 w-full text-left px-3 py-3 rounded-xl transition-all group"
                        style={{ background: "transparent" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <span
                          className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold"
                          style={{ background: "var(--accent-soft)", color: "var(--accent)", fontSize: "10px" }}
                        >
                          {i + 1}
                        </span>
                        <span
                          className="truncate"
                          style={{ fontFamily: "Georgia, serif", fontSize: "14px", color: "#e8e8f0", lineHeight: 1.3 }}
                        >
                          {h.text}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Word count at bottom */}
              <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
                <p style={{ fontSize: "12px", color: "var(--muted)" }}>
                  {(book?.wordCount || 0).toLocaleString()} words written
                </p>
              </div>
            </div>
          </div>
        )}

        {showProfile && (
          <ProfilePanel
            book={book}
            onClose={() => setShowProfile(false)}
            onBookUpdate={(u) => { setBook(u); bookRef.current = u; }}
          />
        )}
      </div>
    );
  }

  /* ─── COVER VIEW ─── */
  const wordCount = book?.wordCount || 0;
  const displayAuthor = authorName || profile?.username || "Writer";
  const isPinned = user?.email === PINNED_EMAIL;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2 flex-shrink-0">
        <div>
          <p style={{ fontSize: "11px", color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Public / Private toggle */}
          <button
            onClick={togglePublic}
            disabled={togglingPublic}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
            style={{
              background: isPublic ? "var(--green-soft)" : "var(--surface2)",
              border: isPublic ? "1px solid rgba(61,153,112,0.3)" : "1px solid var(--border2)",
              color: isPublic ? "var(--green)" : "var(--muted)",
              fontSize: "12px", fontWeight: 500,
            }}
          >
            {isPublic ? (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/>
              </svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            )}
            {isPublic ? "Public" : "Private"}
          </button>

          {/* Avatar */}
          <button
            onClick={() => setShowProfile(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center font-semibold"
            style={{ background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--accent)", fontSize: "13px" }}
          >
            {(profile?.username || user?.email || "W")[0].toUpperCase()}
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="px-5 pt-4 pb-2 flex-shrink-0">
        <p style={{ fontSize: "13px", color: "var(--accent)", fontFamily: "Georgia, serif", fontStyle: "italic", marginBottom: "4px", opacity: 0.8 }}>
          Welcome, {profile?.username ? profile.username.charAt(0).toUpperCase() + profile.username.slice(1) : "writer"}.
        </p>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(1.6rem, 6vw, 2.2rem)", fontWeight: 700, color: "#f0f0f8", lineHeight: 1.25, letterSpacing: "-0.025em" }}>
          {book?.content ? "Your story\ncontinues." : "Your story\nbegins here."}
        </h1>
      </div>

      {/* Book cover */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-4">
        <button onClick={() => setView("writing")} className="w-full max-w-xs book-card-3d" style={{ textAlign: "left" }}>
          <div
            className="w-full rounded-2xl overflow-hidden relative"
            style={{
              background: "linear-gradient(160deg, #18181e 0%, #111115 60%, #0d0d10 100%)",
              border: "1px solid #2a2a32",
              boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 8px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
              aspectRatio: "3/4",
              padding: "36px 28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ width: "28px", height: "2px", background: "var(--accent)", opacity: 0.6, borderRadius: "1px" }} />

            <div className="flex flex-col">
              {editingTitle ? (
                <input
                  autoFocus value={title}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => { setEditingTitle(false); saveTitle(title); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { setEditingTitle(false); saveTitle(title); } }}
                  className="bg-transparent outline-none w-full"
                  style={{ fontFamily: "Georgia, serif", fontSize: "clamp(1.3rem, 5vw, 1.8rem)", fontWeight: 700, color: "#f0f0f8", letterSpacing: "-0.02em", lineHeight: 1.25, borderBottom: "1px solid var(--accent)" }}
                />
              ) : (
                <h2
                  onDoubleClick={(e) => { e.stopPropagation(); setEditingTitle(true); }}
                  style={{ fontFamily: "Georgia, serif", fontSize: "clamp(1.3rem, 5vw, 1.8rem)", fontWeight: 700, color: title === "Untitled" ? "#404050" : "#f0f0f8", letterSpacing: "-0.02em", lineHeight: 1.25, marginBottom: "10px" }}
                >
                  {title}
                </h2>
              )}
              {editingAuthor ? (
                <input
                  autoFocus value={authorName}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setAuthorName(e.target.value)}
                  onBlur={() => { setEditingAuthor(false); saveAuthor(authorName); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { setEditingAuthor(false); saveAuthor(authorName); } }}
                  placeholder="author name"
                  className="bg-transparent outline-none"
                  style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "13px", color: "var(--accent)", width: "160px" }}
                />
              ) : (
                <p
                  onDoubleClick={(e) => { e.stopPropagation(); setEditingAuthor(true); }}
                  style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "13px", color: authorName ? "var(--accent)" : "#32323e", opacity: 0.8 }}
                >
                  {authorName ? `written by ${displayAuthor}` : "written by —"}
                </p>
              )}
            </div>

            <div className="flex items-end justify-between">
              <div style={{ fontSize: "11px", color: "var(--muted)", letterSpacing: "0.08em" }}>
                {wordCount > 0 ? `${wordCount.toLocaleString()} words` : ""}
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.2 }}>
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" fill="currentColor" />
              </svg>
            </div>
          </div>
        </button>

        <p className="mt-5 text-center" style={{ fontSize: "12px", color: "var(--muted)", letterSpacing: "0.04em" }}>
          {book?.content ? "Tap to continue writing" : "Tap the book to start writing"}
        </p>
        <p className="mt-1 text-center" style={{ fontSize: "11px", color: "var(--muted)", opacity: 0.4 }}>
          Double-tap title or author to edit
        </p>
      </div>

      {showProfile && (
        <ProfilePanel book={book} onClose={() => setShowProfile(false)} onBookUpdate={(u) => { setBook(u); bookRef.current = u; }} />
      )}
    </div>
  );
}
