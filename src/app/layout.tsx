import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

// Geometric grotesk for headlines — the futuristic register, replacing the
// warm literary serif that was explicitly rejected.
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  weight: ["500", "600", "700"],
});

// Mono for tags/labels/scores — replaces uppercase-tracking-wide sans labels
// (a very common generic-AI-SaaS tell) with a distinct typographic register.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const title = "ProductPath: find your best-fit product role";
const description =
  "Talk to an AI mentor for two minutes and get every product role (PM, AI PM, Growth, BA and more) scored for how well it fits your background, plus a personalized, trackable roadmap.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s · ProductPath",
  },
  description,
  keywords: [
    "product manager career change",
    "product management roadmap",
    "become a product manager",
    "AI product manager",
    "career transition to product management",
  ],
  authors: [{ name: "ProductPath" }],
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "ProductPath",
    title,
    description,
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e14",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${grotesk.variable} ${mono.variable}`}
    >
      <body className="font-sans">
        <div className="grain-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
