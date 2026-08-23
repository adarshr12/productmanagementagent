"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

export default function ClaimPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Analyzing your profile and scoring 19 product roles...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function claim() {
      try {
        const supabase = createBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          window.location.href = "/login?next=/r/claim&reason=unlock_roadmap";
          return;
        }

        const pendingAnswers = sessionStorage.getItem("pending_answers");
        const pendingIntake = sessionStorage.getItem("pending_intake");

        let intakeId = "";
        let roleId = "";
        let matches = null;

        if (pendingIntake) {
          try {
            const parsed = JSON.parse(pendingIntake);
            intakeId = parsed.intakeId || "";
            roleId = parsed.roleId || "";
            matches = parsed.matches || null;
          } catch {
            // ignore JSON error
          }
        }

        if (pendingAnswers && !intakeId) {
          setStatus("Scoring 19 product roles against your background...");
          const answers = JSON.parse(pendingAnswers);
          const matchRes = await fetch("/api/role-match", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ answers }),
          });

          const matchData = await matchRes.json();
          if (!matchRes.ok) throw new Error(matchData?.error || "Failed to score roles.");

          intakeId = matchData.intakeId;
          matches = matchData.matches;

          sessionStorage.setItem(
            "pending_intake",
            JSON.stringify({ intakeId, matches })
          );
          sessionStorage.removeItem("pending_answers");
        }

        if (!intakeId) {
          router.push("/me");
          return;
        }

        setStatus("Unlocking your custom PM transition roadmap...");
        const res = await fetch("/api/intake/claim", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ intakeId, roleId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to claim roadmap.");

        if (data.shareToken) {
          sessionStorage.removeItem("pending_intake");
          router.push(`/r/${data.shareToken}`);
        } else {
          router.push("/?claimed=true");
        }
      } catch (err: any) {
        setError(err?.message || "Something went wrong processing your roadmap.");
      }
    }

    claim();
  }, [router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 text-center">
      {error ? (
        <div className="card w-full text-left">
          <h1 className="font-display text-xl font-semibold text-ink mb-2">Notice</h1>
          <p className="alert-error mb-4">{error}</p>
          <button
            onClick={() => router.push("/me")}
            className="btn-primary w-full justify-center"
          >
            Go to My Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-accent-500" />
          <h2 className="font-display text-xl font-semibold text-ink">{status}</h2>
          <p className="text-sm text-slate">Connecting your mentor assessment to your account...</p>
        </div>
      )}
    </main>
  );
}
