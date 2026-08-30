import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The mentor flow, admin tools, and every other route are gated behind the
// same NEXT_PUBLIC_LOCKDOWN_MODE flag as the "Coming soon" badges and
// disabled CTAs in src/app/page.tsx. While locked (the default — unset or
// anything other than "false"), every request except the bare landing page
// (and the static assets it needs to render) is redirected back to "/".
// Set NEXT_PUBLIC_LOCKDOWN_MODE=false in Vercel's env vars and redeploy to
// open the rest of the site back up.
const LOCKDOWN_MODE = process.env.NEXT_PUBLIC_LOCKDOWN_MODE !== "false";

export function middleware(request: NextRequest) {
  if (!LOCKDOWN_MODE) {
    return NextResponse.next();
  }

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
