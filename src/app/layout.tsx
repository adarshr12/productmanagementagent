import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Fraunces, JetBrains_Mono } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

// Editorial serif for headlines — the "confident consultant brand" register,
// paired with Jakarta Sans for body/UI text.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

// Mono for tags/labels/scores — replaces uppercase-tracking-wide sans labels
// (a very common generic-AI-SaaS tell) with a distinct typographic register.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Find your best-fit product role — career roadmaps",
  description:
    "Answer a few questions and get your best-fit product role (PM, AI PM, Growth, BA and more) with a match score, plus a personalized, trackable roadmap. Built for career-switchers in India.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${fraunces.variable} ${mono.variable}`}
    >
      <body className="font-sans">
        <div className="grain-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
