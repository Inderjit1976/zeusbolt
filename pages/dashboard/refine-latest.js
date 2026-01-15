import { useEffect } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function RefineLatest() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      // 1. Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      // 2. Call count API
      const res = await fetch("/api/projects/count", {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!res.ok) {
        console.error("Failed to fetch project count");
        router.push("/dashboard");
        return;
      }

      const { count, projects } = await res.json();

      // 3. Option C routing logic
      if (count === 0) {
        router.push("/dashboard");
      } else {
        router.push(`/dashboard/refine/${projects[0].id}`);
      }
    };

    run();
  }, [router]);

  return (
    <div style={{ padding: 40 }}>
      <h2>Preparing your latest idea…</h2>
    </div>
  );
}
