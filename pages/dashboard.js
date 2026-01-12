import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/router";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;

        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);
      } catch (err) {
        console.error("Dashboard auth error:", err);
        setError("Failed to load user");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  if (loading) {
    return <p style={{ padding: 20 }}>Loading dashboard…</p>;
  }

  if (error) {
    return <p style={{ padding: 20, color: "red" }}>{error}</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>ZeusBolt Dashboard</h1>

      <p>
        Logged in as: <strong>{user.email}</strong>
      </p>

      <hr />

      <button
        onClick={async () => {
          alert("Dashboard loaded correctly 🎉");
        }}
      >
        Test Button
      </button>
    </div>
  );
}
