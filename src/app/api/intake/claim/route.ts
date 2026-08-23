import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyUser } from "@/lib/verifyUser";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const intakeId = String(body?.intakeId || "");
    const roleId = String(body?.roleId || "");

    if (!intakeId) {
      return NextResponse.json({ error: "intakeId is required" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Associate intake response with authenticated user
    const { error: intakeErr } = await supabaseAdmin
      .from("intake_responses")
      .update({ user_id: user.id })
      .eq("id", intakeId);

    if (intakeErr) {
      return NextResponse.json(
        { error: `Failed to claim intake: ${intakeErr.message}` },
        { status: 500 }
      );
    }

    // Check if a roadmap already exists for this intake
    const { data: existingRoadmap } = await supabaseAdmin
      .from("roadmaps")
      .select("share_token")
      .eq("intake_response_id", intakeId)
      .maybeSingle();

    if (existingRoadmap?.share_token) {
      // Claim existing roadmap
      await supabaseAdmin
        .from("roadmaps")
        .update({ user_id: user.id })
        .eq("intake_response_id", intakeId);

      return NextResponse.json({ shareToken: existingRoadmap.share_token });
    }

    // If roleId provided but no roadmap yet, trigger roadmap generation directly
    if (roleId) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const token = req.headers.get("authorization");

      const rmRes = await fetch(`${baseUrl}/api/roadmap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
        body: JSON.stringify({ intakeId, roleId }),
      });

      const rmData = await rmRes.json();
      if (!rmRes.ok) throw new Error(rmData?.error || "Failed to generate roadmap.");
      return NextResponse.json({ shareToken: rmData.shareToken });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to claim intake." },
      { status: 500 }
    );
  }
}
