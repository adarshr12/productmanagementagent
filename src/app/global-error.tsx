"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error:", error);
  }, [error]);

  return (
    <html>
      <body className="bg-bg text-ink font-sans antialiased">
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 text-center">
          <div className="card w-full text-left">
            <h2 className="font-display text-xl font-semibold text-ink mb-2">
              Application Error
            </h2>
            <p className="text-sm text-slate mb-6">
              {error?.message || "A critical error occurred."}
            </p>
            <button onClick={() => reset()} className="btn-primary w-full">
              Reload Page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
