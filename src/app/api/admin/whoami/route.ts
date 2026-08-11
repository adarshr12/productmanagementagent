import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/verifyAdmin";

// Lets the admin dashboard's client-side gate check allowlist membership
// (not just "is there a session") before rendering anything.
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
