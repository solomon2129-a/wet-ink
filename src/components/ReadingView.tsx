"use client";

import { Book } from "@/lib/firestore";
import { Timestamp } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";

interface ReadingViewProps {
  book: Book;
  onBack: () => void;
}

function formatDate(ts: Timestamp | undefined): string {
  if (!ts) return "";
  return ts.toDate().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function ReadingView({ book, onBack }: ReadingViewProps) {
  const isRecent = book.updatedAt
    ? Date.now() - book.updatedAt.toDate().getTime() < 1000 * 60 * 30
    : false;

  const displayAuthor = book.authorName || book.username;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(42,42,48,0.5)" }}
      >
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            color: "var(--muted)",
          }}
        >
          <ArrowLeft size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: "var(--text)", fontFamily: "Georgia, serif" }}
          >
            {book.title || "Untitled"}
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            by {displayAuthor}
          </p>
        </div>
        {isRecent && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ background: "rgba(74,158,106,0.12)", border: "1px solid rgba(74,158,106,0.2)" }}
          >
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4a9e6a" }} />
            <span className="text-xs font-medium" style={{ color: "#4a9e6a", fontSize: "10px" }}>
              Live
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 pt-8 pb-24">
          {/* Title */}
          <h1
            className="mb-2"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "clamp(1.6rem, 5vw, 2.4rem)",
              fontWeight: 700,
              color: "#f0f0f8",
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
            }}
          >
            {book.title || "Untitled"}
          </h1>

          {/* Author name — pen name only, no account info */}
          <p
            className="mb-8 text-base"
            style={{
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              color: "var(--accent)",
              opacity: 0.8,
            }}
          >
            by {displayAuthor}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-4 mb-10">
            {book.updatedAt && (
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Updated {formatDate(book.updatedAt)}
              </p>
            )}
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {book.wordCount?.toLocaleString()} words
            </p>
          </div>

          {/* Decorative divider */}
          <div className="flex items-center gap-3 mb-10">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <div className="w-1 h-1 rounded-full" style={{ background: "var(--accent)", opacity: 0.5 }} />
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          {/* Book content */}
          {book.content ? (
            <div
              className="reading-content"
              dangerouslySetInnerHTML={{ __html: book.content }}
            />
          ) : (
            <p
              className="text-sm text-center py-16"
              style={{ color: "var(--muted)", fontFamily: "Georgia, serif", fontStyle: "italic" }}
            >
              The page is blank. A story is coming.
            </p>
          )}

          {/* End mark */}
          {book.content && (
            <div className="flex items-center justify-center mt-16">
              <div
                className="text-xs tracking-widest px-4 py-2 rounded-full"
                style={{ color: "var(--muted)", border: "1px solid var(--border)", fontFamily: "Georgia, serif" }}
              >
                {isRecent ? "Story in progress…" : "∎"}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
