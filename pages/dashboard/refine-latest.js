import { useEffect } from "react";
import { useRouter } from "next/router";

export default function RefineLatestRedirect() {
  const router = useRouter();

  useEffect(() => {
    async function go() {
      try {
        const res = await fetch("/api/projects/list");

        if (res.status === 401) {
          router.replace("/auth");
          return;
        }

        const data = await res.json();

        if (!res.ok || !Array.isArray(data.projects)) {
          router.replace("/dashboard");
          return;
        }

        if (data.projects.length === 0) {
          router.replace("/dashboard");
          return;
        }

        // Most recent project (already sorted server-side)
        const latest = data.projects[0];

        router.replace(`/dashboard/refine/${latest.id}`);
      } catch {
        router.replace("/dashboard");
      }
    }

    go();
  }, [router]);

  return null; // intentional: this page only redirects
}
