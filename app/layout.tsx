import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AppianCheat — Appian Developer Quick Reference",
  description: "Quick-reference cheat sheet for Appian functions, expressions, and design patterns. Built for Appian 25.4.",
  keywords: ["Appian", "cheat sheet", "functions", "expressions", "developer", "reference", "25.4"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-950 text-gray-200">
        {children}
      </body>
    </html>
  );
}
