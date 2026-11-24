"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabaseClient";
import { apiUrl } from "@/lib/api";

export function UserIdAuthHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Avoid redirect loops if on auth or admin sections
    if (
      pathname.startsWith("/login") ||
      pathname.startsWith("/signup") ||
      pathname.startsWith("/admin")
    ) {
      return;
    }

    const supabase = createBrowserClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // 1. If someone visits with legacy user_id query param, clean it up completely
      const urlUserId = searchParams.get("user_id");
      if (urlUserId) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("user_id");
        const newQuery = params.toString() ? `?${params.toString()}` : "";
        if (session) {
          router.replace(`/user/${session.user.id}${newQuery}`);
        } else {
          router.replace(`${pathname}${newQuery}`);
        }
        return;
      }

      // 2. If a logged-in user visits the root "/" (/productagent):
      if (session && pathname === "/") {
        try {
          const res = await fetch(apiUrl("/api/admin/whoami"), {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (res.ok) {
            router.replace("/admin");
            return;
          }
        } catch {}

        const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
        router.replace(`/user/${session.user.id}${query}`);
        return;
      }

      // 3. If an unauthenticated visitor tries to access /user or /user/*,
      // redirect them to login
      if (!session && pathname.startsWith("/user")) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
    });
  }, [pathname, router, searchParams]);

  return null;
}
