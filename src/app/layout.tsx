import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Career Roadmap — PM / PjM / Product Analyst / BA",
  description:
    "Get a personalized, step-by-step learning roadmap to move into Product Manager, Project Manager, Product Analyst, or Business Analyst roles in India.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
