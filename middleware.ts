import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The mentor flow, admin tools, and every other route are not ready for
// public use yet. Until they are, every request except the bare landing
// page (and the static assets it needs to render) is redirected back to
// "/" — which itself already shows a "Coming soon" badge with its CTA
// buttons disabled, rather than being functional.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  // Skip Next's own internals and anything that looks like a static file
  // (a dot in the last path segment — favicon.ico, robots.txt, sitemap.xml,
  // /animations/*.svg, *.lottie, *.wasm, …) so only real app routes/pages
  // get redirected, not the assets the landing page itself depends on.
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
