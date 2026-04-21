import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Booggum Tool",
  description: "AI 기반 영상 자동 생성 툴",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="h-screen overflow-hidden">{children}</body>
    </html>
  );
}
