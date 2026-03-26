"use client";

import { useState, useEffect } from "react";
import { getPublicBooks, Book } from "@/lib/firestore";
import { ReadingView } from "./ReadingView";
import { BookCard } from "@/components/ui/book-card";
import { Timestamp } from "firebase/firestore";

const PINNED_EMAIL = "solomonsam2129@gmail.com";

const PALETTES = [
  { accent: "#9b72cf", glow: "rgba(155,114,207,0.35)" },
  { accent: "#3d9970", glow: "rgba(61,153,112,0.35)" },
  { accent: "#e07830", glow: "rgba(224,120,48,0.35)" },
  { accent: "#4a90d9", glow: "rgba(74,144,217,0.35)" },
  { accent: "#c9a96e", glow: "rgba(201,169,110,0.35)" },
  { accent: "#8ab520", glow: "rgba(138,181,32,0.35)" },
  { accent: "#c9a96e", glow: "rgba(201,169,110,0.35)" },
  { accent: "#30c8c8", glow: "rgba(48,200,200,0.35)" },
];

function getPalette(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function sortBooks(books: Book[]): Book[] {
  return [...books].sort((a, b) => {
    const aPin = a.userEmail === PINNED_EMAIL ? 1 : 0;
    const bPin = b.userEmail === PINNED_EMAIL ? 1 : 0;
    if (bPin !== aPin) return bPin - aPin;
    return (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0);
  });
}

function isLiveBook(updatedAt: Timestamp | undefined): boolean {
  if (!updatedAt) return false;
  return Date.now() - updatedAt.toDate().getTime() < 1000 * 60 * 30;
}

export function DiscoverTab() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Book | null>(null);

  useEffect(() => {
    getPublicBooks().then((b) => { setBooks(sortBooks(b)); setLoading(false); });
  }, []);

  if (selected) return <ReadingView book={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-7 pb-5 flex-shrink-0">
        <h1 style={{
          fontFamily: "Georgia, serif", fontSize: "28px", fontWeight: 700,
          color: "#f0f0f8", letterSpacing: "-0.03em", lineHeight: 1.1,
        }}>
          Discover
        </h1>
        <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>
          {loading ? "" : `${books.length} ${books.length === 1 ? "living book" : "living books"}`}
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {loading ? (
          <div className="flex items-center justify-center pt-24">
            <div className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
          </div>
        ) : books.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-28">
            <p style={{ color: "var(--muted)", fontSize: "14px", fontFamily: "Georgia, serif", fontStyle: "italic" }}>
              No books yet. Be the first.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {books.map((book, i) => {
              const palette = getPalette(book.id);
              return (
                <BookCard
                  key={book.id}
                  index={i}
                  title={book.title}
                  authorName={book.authorName || book.username}
                  snippet={stripHtml(book.content).slice(0, 110)}
                  wordCount={book.wordCount || 0}
                  isLive={isLiveBook(book.updatedAt)}
                  pinned={book.userEmail === PINNED_EMAIL}
                  accentColor={palette.accent}
                  glowColor={palette.glow}
                  updatedAt={book.updatedAt}
                  onClick={() => setSelected(book)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
