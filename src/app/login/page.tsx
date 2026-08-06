"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [next, setNext] = useState("/me");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const n = params.get("next");
    if (n && n.startsWith("/")) setNext(n);
  }, []);

  async function google() {
    setError(null);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${next}` },
    });
    if (error) setError(error.message);
  }

  async function emailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const supabase = createBrowserClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}${next}` },
      });
      setLoading(false);
      if (error) return setError(error.message);
      if (data.session) router.push(next);
      else
        setMessage(
          "Account created! Check your email to confirm, then come back and sign in."
        );
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    router.push(next);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5">
      <div className="w-full">
        <Link
          href="/"
          className="mb-6 inline-block text-lg font-extrabold tracking-tight"
        >
          <span className="text-brand-600">◆</span> ProductPath
        </Link>
        <div className="card">
          <h1 className="text-2xl font-extrabold">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Save your roadmaps and track your progress.
          </p>

          <button
            onClick={google}
            className="btn-ghost mt-6 w-full justify-center py-3"
          >
            <span className="text-base">🇬</span> Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" /> or{" "}
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={emailAuth} className="space-y-4">
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
                minLength={6}
                required
              />
            </div>
            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </p>
            )}
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading
                ? "Please wait…"
                : mode === "signin"
                ? "Sign in"
                : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setMessage(null);
              }}
              className="font-semibold text-brand-600"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
