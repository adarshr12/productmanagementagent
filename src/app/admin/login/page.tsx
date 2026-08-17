"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabaseClient";

// Supabase's client surfaces a raw, sometimes-empty message straight from the
// auth server (a real server error can arrive as "{}", which read as blank
// noise rather than a real error). Map the cases people actually hit to
// something that tells them what to do next.
function friendlyAuthError(error: { message?: string; status?: number }): string {
  const message = (error.message || "").trim();
  if (/invalid login credentials/i.test(message)) {
    return "That email or password isn't right. Double-check and try again.";
  }
  if (/email not confirmed/i.test(message)) {
    return "This account's email hasn't been confirmed yet.";
  }
  if (error.status && error.status >= 500) {
    return "Something went wrong on the sign-in service (not your credentials). Please try again in a moment.";
  }
  if (!message || message === "{}") {
    return "Sign-in failed for an unexpected reason. Please try again in a moment.";
  }
  return message;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(friendlyAuthError(error));
        return;
      }
      router.push("/admin");
    } catch {
      setError(
        "Couldn't reach the sign-in service. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-md">
        <p className="tag mb-2 text-accent-500">site owner only</p>
        <h1 className="font-display mb-6 text-2xl font-semibold text-ink">
          Admin sign in
        </h1>
        <form onSubmit={handleLogin} className="card space-y-4">
          <div>
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="alert-error">
              {error}
            </p>
          )}
          <button type="submit" className="btn-gold w-full py-3" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
