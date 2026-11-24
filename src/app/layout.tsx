import { Suspense } from "react";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { UserIdAuthHandler } from "@/components/auth/UserIdAuthHandler";

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
  themeColor: "#f6f7f9",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <div className="grain-overlay" aria-hidden="true" />
        <Suspense fallback={null}>
          <UserIdAuthHandler />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
