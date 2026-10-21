import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthContainer } from "@/components/auth/AuthContainer";

export const metadata: Metadata = {
  title: "Create an Account · ProductPath",
  description: "Join ProductPath to discover your best-fit product role and build a step-by-step career transition roadmap.",
};

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-paper">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
        </div>
      }
    >
      <AuthContainer initialMode="signup" />
    </Suspense>
  );
}
