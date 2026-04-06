import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "たった今考えたプロポーズの言葉を君に捧ぐよ。",
  description: "単語カードを組み合わせて最高のプロポーズを作ろう！オンラインで友達と遊べるパーティーゲーム。",
  keywords: ["プロポーズ", "ボードゲーム", "パーティーゲーム", "オンライン", "カードゲーム"],
  openGraph: {
    title: "たった今考えたプロポーズの言葉を君に捧ぐよ。",
    description: "単語カードを組み合わせて最高のプロポーズを作ろう！",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
