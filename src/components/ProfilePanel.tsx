"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile, updateBook, Book } from "@/lib/firestore";
import { X, Eye, EyeOff, Globe, Lock } from "lucide-react";

interface ProfilePanelProps {
  book: Book | null;
  onClose: () => void;
  onBookUpdate: (book: Book) => void;
}

export function ProfilePanel({ book, onClose, onBookUpdate }: ProfilePanelProps) {
  const { user, profile, refreshProfile, logout } = useAuth();
  const [bio, setBio] = useState(profile?.bio || "");
  const [isPublic, setIsPublic] = useState(profile?.isPublic ?? true);
  const [allowLive, setAllowLive] = useState(profile?.allowLiveReading ?? true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await updateUserProfile(user.uid, { bio, isPublic, allowLiveReading: allowLive });
    if (book) {
      await updateBook(book.id, { isPublic });
      onBookUpdate({ ...book, isPublic });
    }
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const wordCount = book?.wordCount || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-2xl overflow-hidden"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Profile
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ color: "var(--muted)", background: "var(--surface2)" }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-5">
          {/* Avatar + Name */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold"
              style={{
                background: "var(--accent-soft)",
                border: "1px solid rgba(201,169,110,0.25)",
                color: "var(--accent)",
                fontFamily: "Georgia, serif",
              }}
            >
              {(profile?.username || user?.email || "W")[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                {profile?.username || "Writer"}
              </p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {user?.email}
              </p>
            </div>
          </div>

          {/* Word Count Stat */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
          >
            <div>
              <p
                className="text-xl font-bold"
                style={{ color: "var(--accent)", fontFamily: "Georgia, serif" }}
              >
                {wordCount.toLocaleString()}
              </p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                words written
              </p>
            </div>
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A few words about you…"
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-all"
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-3">
            <ToggleRow
              icon={isPublic ? <Globe size={14} /> : <Lock size={14} />}
              label="Public book"
              description={isPublic ? "Anyone can discover your book" : "Only you can see it"}
              value={isPublic}
              onChange={setIsPublic}
            />
            <ToggleRow
              icon={allowLive ? <Eye size={14} /> : <EyeOff size={14} />}
              label="Live reading"
              description={allowLive ? "Readers see updates in real-time" : "Updates are hidden"}
              value={allowLive}
              onChange={setAllowLive}
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: saved ? "#1e3a2a" : saving ? "var(--surface2)" : "var(--accent)",
              color: saved ? "#4a9e6a" : saving ? "var(--muted)" : "#1a1008",
              border: saved ? "1px solid #2d5a3d" : "none",
            }}
          >
            {saving ? "Saving…" : saved ? "✓ Saved" : "Save Changes"}
          </button>

          {/* Sign Out */}
          <button
            onClick={logout}
            className="w-full py-2 text-xs transition-all"
            style={{ color: "var(--muted)" }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-3 py-3 rounded-xl"
      style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5" style={{ color: "var(--muted)" }}>
          {icon}
        </span>
        <div>
          <p className="text-xs font-medium" style={{ color: "var(--text)" }}>
            {label}
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {description}
          </p>
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className="w-10 h-5.5 rounded-full transition-all flex-shrink-0 relative"
        style={{
          background: value ? "var(--accent)" : "var(--border)",
          width: "36px",
          height: "20px",
        }}
      >
        <span
          className="absolute top-0.5 rounded-full transition-all"
          style={{
            width: "16px",
            height: "16px",
            background: "#fff",
            left: value ? "18px" : "2px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
      </button>
    </div>
  );
}
