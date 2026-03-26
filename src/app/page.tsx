"use client";

import { useAuth } from "@/context/AuthContext";
import { AuthScreen } from "@/components/AuthScreen";
import { AppShell } from "@/components/AppShell";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: "var(--bg)" }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-7 h-7 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
          />
          <p className="text-sm tracking-widest opacity-40" style={{ fontFamily: "Georgia, serif" }}>
            WET INK
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <AppShell />;
}
