"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client using environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Check if user is logged in before showing dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        // Not logged in → send to login page
        router.replace("/auth");
      } else {
        // Logged in → allow dashboard to show
        setLoading(false);
      }
    });
  }, [router]);

  // Logout and redirect safely
  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth"); // prevents back-button access
  }

  // Show loading message while checking session
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





