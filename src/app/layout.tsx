import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "첫집ON — My First Home Navigator",
  description:
    "서울 3개년 실거래 데이터를 기반으로 내 예산과 우선순위에 맞는 첫 주택 전략을 찾는 주거·금융 의사결정 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-surface text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
