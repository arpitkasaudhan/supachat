import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SupaChat — Conversational Analytics",
  description: "Query your blog analytics database in natural language",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
