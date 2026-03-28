import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GLITCH.EXE — Retro Codebase Explorer",
  description: "AI-powered codebase analysis with a chaotic retro UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
