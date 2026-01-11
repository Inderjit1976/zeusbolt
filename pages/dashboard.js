"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client (frontend / anon)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  // Check login + subscription status
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/auth");
        return;
      }

      // Check subscription status
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status, plan")
        .eq("user_id", session.user.id)
        .single();

      if (subscription?.status === "active" && subscription?.plan === "pro") {
        setIsPro(true);
      }

      setLoading(false);
    };

    checkUser();
  }, [router]);

  // Start Stripe checkout
  const handleUpgrade = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert("You must be logged in");
      return;
    }

    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await res.json();

    if (!data.url) {
      alert("Unable to start checkout. Please try again.");
      return;
    }

    window.location.href = data.url;
  };

  // Logout
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

      {isPro ? (
        <>
          <p style={{ color: "green", fontWeight: "bold" }}>
            You are a Pro user 🚀
          </p>
          <p>Pro limits are unlocked.</p>
        </>
      ) : (
        <>
          <p>You are on the Free plan.</p>

          <button
            onClick={handleUpgrade}
            style={{
              marginTop: 20,
              padding: "10px 16px",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Upgrade to Pro 🚀
          </button>
        </>
      )}

      <hr style={{ margin: "40px 0" }} />

      <button
        onClick={handleLogout}
        style={{
          padding: "8px 14px",
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Log out
      </button>
    </div>
  );
}
