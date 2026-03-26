import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Wet Ink",
  description: "A living book platform. Write and read as stories unfold.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Wet Ink",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/logo-icon.png" />
        <link rel="shortcut icon" href="/logo-icon.png" />
      </head>
      <body className="h-full" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
