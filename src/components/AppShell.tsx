"use client";

import { useState } from "react";
import { PagesTab } from "./PagesTab";
import { DiscoverTab } from "./DiscoverTab";

type Tab = "pages" | "discover";

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>("pages");

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
      <div className="flex-1 overflow-hidden">
        {activeTab === "pages" && <PagesTab />}
        {activeTab === "discover" && <DiscoverTab />}
      </div>

      {/* Bottom Nav — minimal, icon + label, no pill */}
      <nav
        className="flex-shrink-0"
        style={{
          borderTop: "1px solid var(--border)",
          background: "rgba(8,8,9,0.96)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        <div className="flex items-center justify-center gap-16 py-3 pb-5">
          {(["pages", "discover"] as const).map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex flex-col items-center gap-1.5 transition-all"
                style={{ color: active ? "var(--accent)" : "var(--muted)", outline: "none" }}
              >
                {tab === "pages" ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth={active ? "1.6" : "1.4"} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth={active ? "1.6" : "1.4"} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                )}
                <span style={{
                  fontSize: "10px",
                  fontWeight: active ? 600 : 400,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}>
                  {tab === "pages" ? "Write" : "Discover"}
                </span>
                {/* Active dot */}
                <div style={{
                  width: "3px", height: "3px", borderRadius: "50%",
                  background: active ? "var(--accent)" : "transparent",
                  transition: "background 0.2s",
                }} />
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
