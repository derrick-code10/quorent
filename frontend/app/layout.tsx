import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quorent - AI News Assistant",
  description: "Personalized news curation with AI",
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
