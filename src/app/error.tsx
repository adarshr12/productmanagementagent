"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 text-center">
      <div className="card w-full text-left">
        <h2 className="font-display text-xl font-semibold text-ink mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-slate mb-6">
          {error?.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex gap-3">
          <button onClick={() => reset()} className="btn-primary flex-1">
            Try again
          </button>
          <Link href="/" className="btn-ghost flex-1 justify-center text-center">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
