import crypto from "crypto";
import { getSupabaseAdmin } from "./supabaseAdmin";

// Simple database-backed rate limiter for the public intake endpoint.
// Returns true if the request is allowed, false if the visitor is over the cap.
export async function checkAndRecordRateLimit(
  identifier: string
): Promise<boolean> {
  const limit = parseInt(process.env.RATE_LIMIT_PER_HOUR || "5", 10);
  const bucket = crypto.createHash("sha256").update(identifier).digest("hex");
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const supabaseAdmin = getSupabaseAdmin();
  const { count, error } = await supabaseAdmin
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("bucket", bucket)
    .gte("created_at", since);

  if (error) {
    throw new Error(`Rate limit check failed: ${error.message}`);
  }
  if ((count ?? 0) >= limit) {
    return false;
  }

  await supabaseAdmin.from("rate_limits").insert({ bucket });
  return true;
}

// Best-effort extraction of a client identifier from request headers.
export function clientIdentifier(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") || "unknown";
}
