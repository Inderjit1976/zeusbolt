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
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/auth");
        return;
      }

      setUserEmail(session.user.email);
      setLoading(false);
    }

    checkSession();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  async function handleUpgrade() {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Unable to start checkout. Please try again.");
    }
  }

  if (loading) {
    return <p style={{ padding: 40 }}>Loading dashboard…</p>;
  }

  return (
    <div style={{ padding: 40, maxWidth: 900, margin: "0 auto" }}>
      <h1>Welcome to ZeusBolt ⚡</h1>
      <p style={{ color: "#555" }}>
        Logged in as <strong>{userEmail}</strong>
      </p>

      {/* UPGRADE BUTTON */}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={handleUpgrade}
          style={{
            padding: "12px 18px",
            fontSize: 16,
            cursor: "pointer",
            backgroundColor: "#000",
            color: "#fff",
            border: "none",
            borderRadius: 6,
          }}
        >
          Upgrade to Pro 🚀
        </button>
      </div>

      {/* DASHBOARD ACTIONS */}
      <div style={{ marginTop: 40 }}>
        <button
          onClick={() => router.push("/projects/new")}
          style={{
            padding: "10px 16px",
            fontSize: 16,
            cursor: "pointer",
            marginRight: 12,
          }}
        >
          Create New Project
        </button>

        <button
          onClick={handleLogout}
          style={{
            padding: "10px 16px",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}
