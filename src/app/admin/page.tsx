"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabaseClient";
import { AgentPromptsPanel } from "@/components/admin/AgentPromptsPanel";
import { KnowledgeBasePanel } from "@/components/admin/KnowledgeBasePanel";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/admin/login");
        return;
      }
      // A valid session isn't enough on its own once public sign-up exists —
      // confirm allowlist membership server-side before rendering anything.
      const res = await fetch("/api/admin/whoami", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        await supabase.auth.signOut();
        router.replace("/admin/login");
        return;
      }
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="tag">loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <nav className="border-b border-line bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            <span className="text-accent-500">◆</span> Admin
          </span>
          <div className="flex items-center gap-5 text-sm">
            <Link
              href="/admin/completions"
              className="font-medium text-slate transition hover:text-ink"
            >
              Completion rates →
            </Link>
            <button
              onClick={signOut}
              className="font-medium text-slate transition hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-5 py-10">
        <section className="mb-12">
          <p className="tag mb-2 text-accent-500">agent prompts</p>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Configure each agent
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate">
            Each place the app calls the model is its own agent, with its own
            system prompt and its own knowledge-base toggle. Edit and save,
            changes apply on the next request, no deploy needed.
          </p>
          <div className="mt-6">
            <AgentPromptsPanel />
          </div>
        </section>

        <section>
          <p className="tag mb-2 text-accent-500">knowledge base</p>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Collect documents
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate">
            Upload a file or paste text to add it to the knowledge base. This
            only feeds an agent&apos;s output once that agent&apos;s
            &ldquo;use knowledge base&rdquo; toggle above is switched on.
          </p>
          <div className="mt-6">
            <KnowledgeBasePanel />
          </div>
        </section>
      </div>
    </main>
  );
}
