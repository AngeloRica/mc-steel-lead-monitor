import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MC Steel Lead Monitor",
  description: "Private construction-material buyer inquiry and public contact monitoring dashboard.",
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
    <html lang="en-PH">
      <body className="antialiased">{children}</body>
    </html>
  );
}
