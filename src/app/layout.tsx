import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Lobster } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

// Decorative font for the hero keyword (from the 21st.dev "Underline Hero").
const lobster = Lobster({
  subsets: ["latin"],
  variable: "--font-lobster",
  weight: "400",
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
    <html lang="en" className={`${jakarta.variable} ${lobster.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
