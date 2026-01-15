import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function RefineIdea() {
  const router = useRouter();
  const { id } = router.query;

  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const loadIdea = async () => {
      try {
        // 1. Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push("/auth");
          return;
        }

        // 2. Fetch project securely
        const res = await fetch(`/api/projects/get?id=${id}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Unable to load idea");
        }

        setIdea(data.project);
      } catch (err) {
        console.error(err);
        setError("Unable to load your idea.");
      } finally {
        setLoading(false);
      }
    };

    loadIdea();
  }, [id, router]);

  if (loading) {
    return <div style={{ padding: 40 }}>Loading your idea…</div>;
  }

  if (error) {
    return <div style={{ padding: 40 }}>{error}</div>;
  }

  if (!idea) {
    return <div style={{ padding: 40 }}>Idea not found.</div>;
  }

  return (
    <div style={{ padding: 40, maxWidth: 800 }}>
      <h1>Refine your idea</h1>

      <p style={{ opacity: 0.7 }}>Original idea:</p>

      <div
        style={{
          marginTop: 12,
          padding: 16,
          borderRadius: 8,
          background: "rgba(255,255,255,0.05)",
        }}
      >
        {idea.content}
      </div>
    </div>
  );
}
