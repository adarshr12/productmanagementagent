import Link from "next/link";

export function SiteNav() {
  return (
    <nav className="border-b border-white/[0.08] bg-ink/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight text-cream"
        >
          <span className="text-accent-500">◆</span> ProductPath
        </Link>
        <Link
          href="/login?next=/me"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-cream/80 transition hover:bg-white/5 hover:text-cream"
        >
          Log in
        </Link>
      </div>
    </nav>
  );
}
