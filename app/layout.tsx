import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ChatWidget from "./components/ChatWidget";
import "./globals.css";

export const metadata: Metadata = {
  title: "AppianCheat — Appian Developer Quick Reference",
  description: "Quick-reference cheat sheet for Appian functions, expressions, and design patterns. AI-powered SAIL code generator - describe or sketch your interface. Built for Appian 25.4.",
  keywords: ["Appian", "cheat sheet", "functions", "expressions", "developer", "reference", "25.4", "AI assistant", "SAIL generator", "interface builder", "community", "Q&A"],
  openGraph: {
    title: "AppianCheat — Appian Developer Quick Reference",
    description: "The ultimate Appian developer cheat sheet with AI-powered assistant, community Q&A, functions, patterns, errors, and instant answers.",
    type: "website",
    url: "https://appian-cheat.vercel.app",
  },
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
        <ChatWidget />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
