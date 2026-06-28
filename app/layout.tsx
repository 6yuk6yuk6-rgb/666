import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "프롬프트 보관소",
  description: "이미지 생성용 프롬프트를 사진과 함께 정리하는 개인 보관소"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
