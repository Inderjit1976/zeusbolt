"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/auth");
      } else {
        setLoading(false);
      }
    });
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
  };

  if (loading) {
    return <p style={{ padding: 40 }}>Checking login…</p>;
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Welcome to ZeusBolt ⚡</h1>
      <p>You are logged in.</p>

      <button
        onClick={handleLogout}
        style={{
          marginTop: 20,
          padding: "10px 16px",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        Log out
      </button>
    </div>
  );
}




