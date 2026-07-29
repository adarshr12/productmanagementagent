import { NextResponse } from "next/server";
import { getRoadmapByToken } from "@/lib/getRoadmap";

// Public read of a saved roadmap by its share token. Reusable by a mobile app.
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { shareToken: string } }
) {
  const data = await getRoadmapByToken(params.shareToken);
  if (!data) {
    return NextResponse.json({ error: "Roadmap not found." }, { status: 404 });
  }
  return NextResponse.json(data);
}
