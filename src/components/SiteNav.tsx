"use client";

import Link from "next/link";
import { Compass } from "lucide-react";

export function SiteNav() {
  return (
    <nav className="border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <a
          href="/"
          onClick={(e) => {
            if (typeof window !== "undefined" && window.location.pathname === "/") {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent("reset-landing"));
            }
          }}
          className="flex items-center gap-2 font-display text-xl font-normal tracking-wide text-ink cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Compass className="h-5 w-5 text-accent-500" strokeWidth={2.25} />
          ProductPath
        </a>
        <div className="flex items-center gap-1">
          <Link
            href="/assistant"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate transition hover:bg-accent-50 hover:text-ink"
          >
            Ask AI
          </Link>
          <Link
            href="/login?next=/me"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate transition hover:bg-accent-50 hover:text-ink"
          >
            Log in
          </Link>
        </div>
      </div>
    </nav>
  );
}
