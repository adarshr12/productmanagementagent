"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabaseClient";
import HomeExperience from "@/components/HomeExperience";

export default function UserPage() {
  const params = useParams();
  const router = useRouter();
  const routeUuid = params?.uuid as string;
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace(`/login?next=/user/${routeUuid}`);
        return;
      }
      if (session.user.id !== routeUuid) {
        router.replace(`/user/${session.user.id}`);
        return;
      }
      setAuthorized(true);
    });
  }, [routeUuid, router]);

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  return <HomeExperience />;
}
