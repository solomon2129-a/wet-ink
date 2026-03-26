"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BookOpen, Clock } from "lucide-react";
import { Timestamp } from "firebase/firestore";

interface BookCardProps {
  title: string;
  authorName: string;
  snippet: string;
  wordCount: number;
  isLive: boolean;
  pinned: boolean;
  accentColor: string;
  glowColor: string;
  updatedAt?: Timestamp;
  className?: string;
  onClick: () => void;
  index: number;
}

function timeAgo(ts: Timestamp | undefined): string {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - ts.toDate().getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function BookCard({
  title,
  authorName,
  snippet,
  wordCount,
  isLive,
  pinned,
  accentColor,
  glowColor,
  updatedAt,
  className,
  onClick,
  index,
}: BookCardProps) {
  const ago = timeAgo(updatedAt);
  const initials = authorName.slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: index * 0.06 }}
      className={cn("relative w-full cursor-pointer", className)}
      onClick={onClick}
    >
      {/* Glow blob beneath card */}
      <div
        className="pointer-events-none absolute inset-x-4 -bottom-6 top-[65%] rounded-[28px] blur-xl z-0"
        style={{ background: glowColor, opacity: 0.5 }}
      />

      {/* Bottom label — like the "Currently High on Creativity" strip */}
      <div className="absolute inset-x-0 -bottom-5 mx-auto z-0 flex items-center justify-center gap-2 text-xs font-medium"
        style={{ color: accentColor, opacity: 0.75 }}>
        <BookOpen size={11} />
        {isLive ? "Writing in progress…" : wordCount > 0 ? `${wordCount.toLocaleString()} words` : "Just begun"}
      </div>

      {/* Main card */}
      <Card
        className="relative z-10 w-full overflow-visible border-0 text-white"
        style={{
          borderRadius: "24px",
          background: "radial-gradient(120% 120% at 30% 10%, #1c1c22 0%, #111116 60%, #0c0c0e 100%)",
          boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)`,
        }}
      >
        <CardContent className="p-5">
          {/* Top status row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span
                className={cn("inline-block h-2 w-2 rounded-full", isLive ? "animate-pulse" : "")}
                style={{ background: isLive ? "#3d9970" : accentColor, opacity: isLive ? 1 : 0.5 }}
              />
              <span className="text-xs text-neutral-400 select-none">
                {isLive ? "Writing now" : "Last updated"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 opacity-60">
              <Clock size={12} className="text-neutral-400" />
              <span className="text-xs tabular-nums text-neutral-400">{ago || "—"}</span>
            </div>
          </div>

          {/* Avatar + title row */}
          <div className="flex items-center gap-4 mb-4">
            {/* Author avatar */}
            <div
              className="h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center text-sm font-bold"
              style={{
                background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}11)`,
                border: `1px solid ${accentColor}40`,
                color: accentColor,
                letterSpacing: "0.04em",
              }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="truncate font-bold tracking-tight leading-tight"
                style={{ fontFamily: "Georgia, serif", fontSize: "17px", color: "#eeeef8", letterSpacing: "-0.02em" }}
              >
                {title || "Untitled"}
              </h3>
              <p className="text-sm mt-0.5" style={{ color: accentColor, opacity: 0.85, fontStyle: "italic", fontFamily: "Georgia, serif" }}>
                {authorName}
              </p>
            </div>
            {pinned && (
              <div className="shrink-0 text-xs font-semibold px-2 py-1 rounded-full"
                style={{ background: "rgba(201,169,110,0.12)", color: "#c9a96e", border: "1px solid rgba(201,169,110,0.2)", fontSize: "10px", letterSpacing: "0.06em" }}>
                ✦
              </div>
            )}
          </div>

          {/* Snippet */}
          {snippet && (
            <p
              className="text-sm leading-relaxed mb-4"
              style={{
                color: "#888898",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                fontFamily: "Georgia, serif",
              }}
            >
              {snippet}…
            </p>
          )}

          {/* Bottom action row */}
          <div className="flex items-center gap-3 mt-1">
            <button
              className="flex-1 h-10 flex items-center justify-center gap-2 rounded-2xl text-sm font-medium transition-all"
              style={{
                background: `${accentColor}18`,
                color: accentColor,
                border: `1px solid ${accentColor}30`,
              }}
            >
              <BookOpen size={13} />
              Read
            </button>
            <div
              className="h-10 px-4 flex items-center rounded-2xl text-xs font-medium"
              style={{ background: "rgba(255,255,255,0.06)", color: "#666676", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {wordCount > 0 ? `${wordCount.toLocaleString()}w` : "—"}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
