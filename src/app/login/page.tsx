import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthContainer } from "@/components/auth/AuthContainer";

export const metadata: Metadata = {
  title: "Log in · ProductPath",
  description: "Sign in to your ProductPath account to access your saved roadmaps and AI mentor discussions.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-paper">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
        </div>
      }
    >
      <AuthContainer initialMode="signin" />
    </Suspense>
  );
}
