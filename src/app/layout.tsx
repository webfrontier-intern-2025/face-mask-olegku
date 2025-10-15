import "./globals.css";
import React from "react";

export const metadata = {
  title: "顔ぼかしツール",
  description: "写真をアップロードすると、顔の部分が自動的にぼかされます。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-dvh antialiased">
        <main className="mx-auto grid max-w-4xl gap-6 p-6">
          <header className="rounded-2xl border border-neutral-800 p-6">
            <h1 className="text-2xl font-semibold">顔ぼかしツール</h1>
            <p className="mt-1 text-sm text-neutral-400">
              画像を追加して「マスクする」を押してください。
            </p>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
