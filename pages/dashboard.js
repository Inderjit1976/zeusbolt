// Dashboard UX polish
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

// Frontend Supabase client (anon key only)
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

  // Load user + subscription
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

  // Start Stripe checkout (Free users only)
  const handleUpgrade = async () => {
    setError("");

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error("Checkout failed");
      }

      window.location.href = data.url;
    } catch (err) {
      setError("Unable to start checkout. Please try again.");
    }
  };

  // Logout
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
          <p style={{ marginTop: 6 }}>
            You have
