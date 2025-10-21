import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memo App - 高速メモアプリ",
  description: "Next.jsで作られた高速で使いやすいメモアプリケーション",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
