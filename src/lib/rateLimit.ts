import crypto from "crypto";
import { getSupabaseAdmin } from "./supabaseAdmin";

// Simple database-backed rate limiter, shared by every public endpoint that
// needs one. `identifier` should be prefixed per-feature (e.g. "assistant:"
// + IP) so different features don't silently share one budget — a chat
// feature sends far more requests per session than a one-shot form.
export async function checkAndRecordRateLimit(
  identifier: string,
  limit = parseInt(process.env.RATE_LIMIT_PER_HOUR || "5", 10)
): Promise<boolean> {
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
