import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <p style={{ padding: 20 }}>Loading dashboard…</p>;
  }

  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h1>ZeusBolt Dashboard</h1>
        <p style={{ color: "red" }}>
          No user session found. You are not logged in.
        </p>
        <p>
          This is expected during setup. Auth is working, but no login page exists
          yet.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>ZeusBolt Dashboard</h1>

      <p>
        Logged in as: <strong>{user.email}</strong>
      </p>

      <hr />

      <button
        onClick={() => {
          alert("Dashboard + auth now works 🎉");
        }}
      >
        Test Button
      </button>
    </div>
  );
}
