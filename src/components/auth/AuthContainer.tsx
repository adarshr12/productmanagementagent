"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Target,
  Briefcase,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Check,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabaseClient";

export type AuthMode = "signin" | "signup" | "forgot";

interface AuthContainerProps {
  initialMode?: AuthMode;
}

const PM_ROLES = [
  "Product Manager (General)",
  "Associate Product Manager (APM)",
  "Technical Product Manager (TPM)",
  "AI / ML Product Manager",
  "Growth Product Manager",
  "Product Analyst / Business Analyst",
  "Still exploring all options",
];

function friendlyAuthError(error: { message?: string; status?: number }): string {
  const message = (error?.message || "").trim();
  if (/invalid login credentials/i.test(message)) {
    return "The email or password you entered is incorrect. Double-check and try again.";
  }
  if (/user already registered/i.test(message)) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Your email address hasn't been confirmed yet. Please check your inbox for the confirmation link.";
  }
  if (/password should be at least/i.test(message)) {
    return "Password must be at least 6 characters long.";
  }
  if (/rate limit/i.test(message) || error.status === 429) {
    return "Too many requests. Please wait a minute and try again.";
  }
  if (error.status && error.status >= 500) {
    return "The authentication service is temporarily unavailable. Please try again shortly.";
  }
  if (!message || message === "{}") {
    return "An unexpected error occurred. Please try again.";
  }
  return message;
}

export function AuthContainer({ initialMode = "signin" }: AuthContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [next, setNext] = useState("/me");

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [signupComplete, setSignupComplete] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  useEffect(() => {
    const n = searchParams.get("next");
    if (n && n.startsWith("/")) {
      setNext(n);
    }
    const paramMode = searchParams.get("mode") || searchParams.get("tab");
    if (paramMode === "signup") {
      setMode("signup");
    } else if (paramMode === "signin") {
      setMode("signin");
    } else if (paramMode === "forgot") {
      setMode("forgot");
    }
  }, [searchParams]);

  // Check if user is already logged in
  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace(next);
      }
    });
  }, [next, router]);

  // Password Strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "None", color: "bg-slate-200" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass) && pass.length >= 10) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: "Weak", color: "bg-rose-500", text: "text-rose-600" };
      case 2:
        return { score: 2, label: "Fair", color: "bg-amber-500", text: "text-amber-600" };
      case 3:
        return { score: 3, label: "Good", color: "bg-blue-500", text: "text-blue-600" };
      case 4:
        return { score: 4, label: "Strong", color: "bg-emerald-500", text: "text-emerald-600" };
      default:
        return { score: 1, label: "Weak", color: "bg-rose-500", text: "text-rose-600" };
    }
  };

  const passwordStrength = getPasswordStrength(password);

  async function handleGoogleAuth() {
    setError(null);
    setGoogleLoading(true);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${next}`,
        },
      });
      if (error) {
        setError(friendlyAuthError(error));
        setGoogleLoading(false);
      }
    } catch {
      setError("Failed to initialize Google sign-in. Please try again.");
      setGoogleLoading(false);
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const supabase = createBrowserClient();

    // Mode: FORGOT PASSWORD
    if (mode === "forgot") {
      if (!email) {
        setError("Please enter your email address.");
        return;
      }
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login?next=/me`,
        });
        setLoading(false);
        if (error) {
          setError(friendlyAuthError(error));
        } else {
          setResetEmailSent(true);
          setSuccessMessage(
            `Password reset link sent to ${email}. Please check your inbox and spam folders.`
          );
        }
      } catch {
        setLoading(false);
        setError("Failed to send reset instructions. Please try again.");
      }
      return;
    }

    // Mode: SIGN UP
    if (mode === "signup") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!agreeTerms) {
        setError("Please agree to the Terms of Service & Privacy Policy.");
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim() || undefined,
              target_role: targetRole || undefined,
            },
            emailRedirectTo: `${window.location.origin}${next}`,
          },
        });
        setLoading(false);
        if (error) {
          setError(friendlyAuthError(error));
          return;
        }

        if (data.session) {
          // Auto signed in!
          router.push(next);
        } else {
          // Confirmation email sent
          setSignupComplete(true);
        }
      } catch {
        setLoading(false);
        setError("Something went wrong during sign up. Please try again.");
      }
      return;
    }

    // Mode: SIGN IN
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (error) {
        setError(friendlyAuthError(error));
        return;
      }
      router.push(next);
    } catch {
      setLoading(false);
      setError("Sign-in failed. Please check your network and credentials.");
    }
  }

  return (
    <main className="min-h-screen w-full bg-paper flex flex-col justify-between selection:bg-accent-500/20">
      {/* Top Bar with brand logo */}
      <header className="w-full border-b border-line/60 bg-paper/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-ink transition hover:opacity-85"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/10 text-accent-500 shadow-sm border border-accent-500/20">
              <Compass className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <span>ProductPath</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate sm:inline">
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
            </span>
            <button
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setSuccessMessage(null);
              }}
              className="font-semibold text-accent-500 hover:text-accent-600 transition underline-offset-4 hover:underline"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container: Split View on Large Screens */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="grid w-full max-w-5xl items-center gap-8 lg:grid-cols-12 lg:gap-14">
          
          {/* Left Column: Product Value & Social Proof (Hidden on smaller screens) */}
          <div className="hidden lg:col-span-5 lg:flex lg:flex-col lg:justify-center space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent-500/20 bg-accent-50 px-3.5 py-1 text-xs font-semibold text-accent-600 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                <span>The AI Career Transition Platform</span>
              </div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink xl:text-4xl leading-[1.15]">
                Transition into Product Management with clarity.
              </h2>
              <p className="text-base text-slate leading-relaxed">
                Score your fit across 19 specialized PM disciplines, generate a customized roadmap, and track every career milestone.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-4">
              <div className="flex items-start gap-3.5 rounded-2xl border border-line/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm transition duration-200 hover:border-accent-500/30">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-500 border border-accent-200/50">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-ink">Personalized Role Scoring</h4>
                  <p className="mt-0.5 text-xs text-slate">
                    Identifies whether you fit AI PM, Growth, Technical PM, or Analyst roles best.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl border border-line/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm transition duration-200 hover:border-accent-500/30">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-500 border border-accent-200/50">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-ink">Actionable Sprint Roadmaps</h4>
                  <p className="mt-0.5 text-xs text-slate">
                    Break your transition down into bite-sized artifacts, case studies, and reading lists.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl border border-line/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm transition duration-200 hover:border-accent-500/30">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-500 border border-accent-200/50">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-ink">Track Progress Across Visits</h4>
                  <p className="mt-0.5 text-xs text-slate">
                    Save roadmaps to your account, check off completed steps, and consult your AI mentor anytime.
                  </p>
                </div>
              </div>
            </div>

            {/* Testimonial / Credibility snippet */}
            <div className="rounded-2xl border border-line bg-gradient-to-br from-white/90 to-surface-raised/80 p-5 shadow-sm">
              <div className="flex items-center gap-1 text-amber-400 mb-2">
                {"★★★★★".split("").map((star, i) => (
                  <span key={i} className="text-sm">★</span>
                ))}
              </div>
              <p className="text-xs italic text-slate leading-relaxed">
                &ldquo;ProductPath pinpointed my exact skills gaps from QA engineering to Associate PM and gave me a step-by-step game plan. Saved me months of guessing.&rdquo;
              </p>
              <div className="mt-3 flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-500 text-[11px] font-bold text-white">
                  PK
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink">Priyanshu K.</p>
                  <p className="text-[10px] text-slate-soft">Former QA Engineer → APM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Auth Card */}
          <div className="w-full lg:col-span-7 flex justify-center">
            <div className="w-full max-w-md">
              <div className="card relative overflow-hidden p-6 sm:p-8 backdrop-blur-xl bg-white/95 border-line shadow-[0_20px_50px_-15px_rgba(15,23,42,0.08)]">
                
                {/* Decorative subtle ambient top glow */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent-400 via-accent-500 to-accent-violet" />

                {/* EMAIL CONFIRMATION STATE */}
                {signupComplete ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-4 text-center space-y-5"
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                      <Mail className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-display text-2xl font-bold text-ink">
                        Check your inbox
                      </h3>
                      <p className="text-sm text-slate leading-relaxed">
                        We sent a verification link to{" "}
                        <span className="font-semibold text-ink">{email}</span>.
                      </p>
                      <p className="text-xs text-slate-soft">
                        Click the link in that email to confirm your account and access your personalized roadmaps.
                      </p>
                    </div>

                    <div className="pt-2 space-y-3">
                      <button
                        onClick={() => {
                          setSignupComplete(false);
                          setMode("signin");
                        }}
                        className="btn-primary w-full"
                      >
                        Return to Sign In
                      </button>
                      <p className="text-xs text-slate">
                        Didn&apos;t receive it? Check your spam folder or{" "}
                        <button
                          onClick={handleEmailAuth}
                          disabled={loading}
                          className="font-semibold text-accent-500 hover:underline"
                        >
                          resend verification
                        </button>
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="mb-6 space-y-2">
                      {mode === "forgot" ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setMode("signin");
                              setError(null);
                              setSuccessMessage(null);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate hover:text-ink hover:bg-paper transition"
                            aria-label="Back to sign in"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </button>
                          <div>
                            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
                              Reset password
                            </h1>
                            <p className="text-xs text-slate">
                              Enter your email to receive recovery instructions.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Segmented Tab Switcher */}
                          <div className="relative mb-5 flex rounded-xl bg-paper p-1 border border-line/60">
                            <button
                              type="button"
                              onClick={() => {
                                setMode("signin");
                                setError(null);
                                setSuccessMessage(null);
                              }}
                              className={`relative z-10 flex-1 py-2 text-center text-xs font-semibold transition duration-150 ${
                                mode === "signin"
                                  ? "text-ink"
                                  : "text-slate hover:text-ink"
                              }`}
                            >
                              Sign In
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMode("signup");
                                setError(null);
                                setSuccessMessage(null);
                              }}
                              className={`relative z-10 flex-1 py-2 text-center text-xs font-semibold transition duration-150 ${
                                mode === "signup"
                                  ? "text-ink"
                                  : "text-slate hover:text-ink"
                              }`}
                            >
                              Create Account
                            </button>
                            <div
                              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm border border-line/60 transition-transform duration-200 ease-out ${
                                mode === "signup"
                                  ? "translate-x-[calc(100%+4px)]"
                                  : "translate-x-0"
                              }`}
                            />
                          </div>

                          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
                            {mode === "signin"
                              ? "Welcome back"
                              : "Start your PM journey"}
                          </h1>
                          <p className="text-xs sm:text-sm text-slate">
                            {mode === "signin"
                              ? "Sign in to access your roadmaps and AI mentor discussions."
                              : "Create your free account to unlock all 19 role roadmaps."}
                          </p>
                        </>
                      )}
                    </div>

                    {/* OAuth Button (Only for signin/signup) */}
                    {mode !== "forgot" && (
                      <>
                        <button
                          type="button"
                          onClick={handleGoogleAuth}
                          disabled={googleLoading || loading}
                          className="btn-ghost relative w-full py-2.5 font-medium flex items-center justify-center gap-3 border-line shadow-sm hover:shadow transition"
                        >
                          {googleLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-slate" />
                          ) : (
                            <svg className="h-4 w-4" viewBox="0 0 24 24">
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                              />
                            </svg>
                          )}
                          <span>Continue with Google</span>
                        </button>

                        <div className="my-5 flex items-center gap-3 text-xs text-slate-soft">
                          <div className="h-px flex-1 bg-line" />
                          <span>or with email</span>
                          <div className="h-px flex-1 bg-line" />
                        </div>
                      </>
                    )}

                    {/* Alerts */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800"
                      >
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                        <span className="leading-snug">{error}</span>
                      </motion.div>
                    )}

                    {successMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-800"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                        <span className="leading-snug">{successMessage}</span>
                      </motion.div>
                    )}

                    {/* Form Fields */}
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                      {/* Full Name (Sign Up only) */}
                      {mode === "signup" && (
                        <div>
                          <label className="field-label" htmlFor="fullName">
                            Full Name
                          </label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-soft pointer-events-none" />
                            <input
                              id="fullName"
                              type="text"
                              autoComplete="name"
                              placeholder="Alex Morgan"
                              className="field-input !pl-11"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      )}

                      {/* Target Role selection (Sign Up only) */}
                      {mode === "signup" && (
                        <div>
                          <label className="field-label" htmlFor="targetRole">
                            Target PM Role <span className="text-slate-soft text-xs font-normal">(optional)</span>
                          </label>
                          <div className="relative">
                            <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-soft pointer-events-none" />
                            <select
                              id="targetRole"
                              value={targetRole}
                              onChange={(e) => setTargetRole(e.target.value)}
                              className="field-input !pl-11 !pr-10 appearance-none bg-white cursor-pointer"
                            >
                              <option value="">Select your preferred role</option>
                              {PM_ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                            <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-soft pointer-events-none rotate-90" />
                          </div>
                        </div>
                      )}

                      {/* Email (All modes) */}
                      <div>
                        <label className="field-label" htmlFor="email">
                          Work or Personal Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-soft pointer-events-none" />
                          <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="alex@example.com"
                            className="field-input !pl-11"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      {/* Password (signin & signup) */}
                      {mode !== "forgot" && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="field-label mb-0" htmlFor="password">
                              Password
                            </label>
                            {mode === "signin" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setMode("forgot");
                                  setError(null);
                                  setSuccessMessage(null);
                                }}
                                className="text-xs font-medium text-accent-500 hover:text-accent-600 transition"
                              >
                                Forgot password?
                              </button>
                            )}
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-soft pointer-events-none" />
                            <input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              autoComplete={mode === "signin" ? "current-password" : "new-password"}
                              placeholder="••••••••"
                              minLength={6}
                              className="field-input !pl-11 !pr-11"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-soft hover:text-slate transition"
                              tabIndex={-1}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>

                          {/* Password Strength Indicator (Signup only) */}
                          {mode === "signup" && password.length > 0 && (
                            <div className="mt-2.5 space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate">Strength:</span>
                                <span className={`font-semibold ${passwordStrength.text}`}>
                                  {passwordStrength.label}
                                </span>
                              </div>
                              <div className="grid grid-cols-4 gap-1.5">
                                {[1, 2, 3, 4].map((seg) => (
                                  <div
                                    key={seg}
                                    className={`h-1.5 rounded-full transition-colors duration-200 ${
                                      passwordStrength.score >= seg
                                        ? passwordStrength.color
                                        : "bg-slate-100"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Confirm Password (signup only) */}
                      {mode === "signup" && (
                        <div>
                          <label className="field-label" htmlFor="confirmPassword">
                            Confirm Password
                          </label>
                          <div className="relative">
                            <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-soft pointer-events-none" />
                            <input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="••••••••"
                              minLength={6}
                              className={`field-input !pl-11 !pr-11 ${
                                confirmPassword && password !== confirmPassword
                                  ? "border-rose-300 focus:border-rose-400"
                                  : ""
                              }`}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-soft hover:text-slate transition"
                              tabIndex={-1}
                              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {confirmPassword && password !== confirmPassword && (
                            <p className="mt-1 text-[11px] text-rose-600">
                              Passwords do not match.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Remember Me / Terms checkboxes */}
                      {mode === "signin" ? (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            id="remember"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-4 w-4 rounded border-line text-accent-500 focus:ring-accent-500/20"
                          />
                          <label htmlFor="remember" className="text-xs text-slate cursor-pointer">
                            Keep me signed in
                          </label>
                        </div>
                      ) : mode === "signup" ? (
                        <div className="flex items-start gap-2 pt-1">
                          <input
                            id="terms"
                            type="checkbox"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-line text-accent-500 focus:ring-accent-500/20"
                            required
                          />
                          <label htmlFor="terms" className="text-xs text-slate leading-relaxed cursor-pointer">
                            I agree to the{" "}
                            <span className="text-ink font-medium hover:underline">
                              Terms of Service
                            </span>{" "}
                            and{" "}
                            <span className="text-ink font-medium hover:underline">
                              Privacy Policy
                            </span>
                            .
                          </label>
                        </div>
                      ) : null}

                      {/* Submit Action Button */}
                      <button
                        type="submit"
                        disabled={loading || googleLoading}
                        className="btn-gold w-full py-3 font-semibold shadow-md flex items-center justify-center gap-2 text-sm mt-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>
                              {mode === "signin"
                                ? "Signing in…"
                                : mode === "signup"
                                ? "Creating account…"
                                : "Sending instructions…"}
                            </span>
                          </>
                        ) : (
                          <>
                            <span>
                              {mode === "signin"
                                ? "Sign in to ProductPath"
                                : mode === "signup"
                                ? "Create free account"
                                : "Send reset instructions"}
                            </span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Footer toggles */}
                    <div className="mt-6 border-t border-line/60 pt-4 text-center">
                      {mode === "forgot" ? (
                        <button
                          onClick={() => {
                            setMode("signin");
                            setError(null);
                            setSuccessMessage(null);
                          }}
                          className="text-xs font-semibold text-accent-500 hover:underline"
                        >
                          Remember your password? Sign in
                        </button>
                      ) : (
                        <p className="text-xs text-slate">
                          {mode === "signin"
                            ? "New to ProductPath?"
                            : "Already have an account?"}{" "}
                          <button
                            onClick={() => {
                              setMode(mode === "signin" ? "signup" : "signin");
                              setError(null);
                              setSuccessMessage(null);
                            }}
                            className="font-semibold text-accent-500 hover:text-accent-600 hover:underline"
                          >
                            {mode === "signin"
                              ? "Create an account"
                              : "Sign in instead"}
                          </button>
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Trust Subtext */}
              <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-soft">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Bank-grade encryption
                </span>
                <span>•</span>
                <span>No spam guarantee</span>
                <span>•</span>
                <span>Free forever tier</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-line/40 py-5 text-center text-xs text-slate-soft">
        <p>© {new Date().getFullYear()} ProductPath. Designed for aspiring and transitioning Product Managers.</p>
      </footer>
    </main>
  );
}
