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
  const [user, setUser] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/auth");
        return;
      }

      setUser(session.user);

      const { data } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", session.user.id)
        .single();

      if (data?.plan === "pro" && data?.status === "active") {
        setIsPro(true);
      }

      setLoading(false);
    };

    loadDashboard();
  }, [router]);

  const handleUpgrade = async () => {
    setError("");
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok || !data.url) throw new Error();

      window.location.href = data.url;
    } catch {
      setError("Unable to start checkout. Please try again.");
    }
  };

  const handleManageBilling = async () => {
    setError("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    try {
      const res = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.url) throw new Error();

      window.location.href = data.url;
    } catch {
      setError("Unable to open billing portal.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
  };

  if (loading) {
    return <p style={{ padding: 40 }}>Loading dashboard…</p>;
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Welcome to ZeusBolt ⚡</h1>

      <p>
        Logged in as <strong>{user.email}</strong>
      </p>

      {isPro ? (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            background: "#eaffea",
            borderRadius: 6,
          }}
        >
          <p style={{ color: "green", fontWeight: "bold", margin: 0 }}>
            ✅ Pro plan active
          </p>

          <button
            onClick={handleManageBilling}
            style={{
              marginTop: 12,
              padding: "10px 16px",
              cursor: "pointer",
            }}
          >
            Manage Billing
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 20 }}>
          <p>You are currently on the Free plan.</p>

          <button
            onClick={handleUpgrade}
            style={{
              marginTop: 12,
              padding: "12px 20px",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Upgrade to Pro 🚀
          </button>
        </div>
      )}

      {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

      <hr style={{ margin: "40px 0" }} />

      <button onClick={handleLogout}>Log out</button>
    </div>
  );
}
