import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Services Gladiator Arena",
  description: "Learn, practice and master 152 AI Services interview challenges.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
