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
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      setUser(user);

      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      setSubscription(data || null);
      setLoading(false);
    };

    load();
  }, [router]);

  const openBillingPortal = async () => {
    const res = await fetch("/api/create-portal-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error || "Unable to open billing portal");
    }
  };

  if (loading) {
    return <div style={{ padding: 48 }}>Loading dashboard…</div>;
  }

  return (
    <div
      style={{
        padding: "48px 32px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      {/* PAGE TITLE */}
      <h1 style={{ fontSize: 30, fontWeight: 700 }}>
        Dashboard
      </h1>

      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Welcome back{user?.email ? `, ${user.email}` : ""}.
      </p>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
          marginTop: 40,
        }}
      >
        {/* SUBSCRIPTION CARD */}
        <div
          style={{
            padding: 24,
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 600 }}>
            Subscription
          </h3>

          {subscription ? (
            <div style={{ marginTop: 16 }}>
              <p>
                <strong>Plan:</strong> Pro
              </p>
              <p>
                <strong>Status:</strong> Active
              </p>

              <button
                style={{ marginTop: 16 }}
                onClick={openBillingPortal}
              >
                Manage billing
              </button>
            </div>
          ) : (
            <p style={{ marginTop: 16 }}>
              No active subscription
            </p>
          )}
        </div>

        {/* PLACEHOLDER CARD (FUTURE) */}
        <div
          style={{
            padding: 24,
            border: "1px dashed rgba(255,255,255,0.15)",
            borderRadius: 10,
            opacity: 0.7,
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 600 }}>
            Your projects
          </h3>

          <p style={{ marginTop: 12 }}>
            App ideas and generated structures will appear here.
          </p>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div style={{ marginTop: 56 }}>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/auth");
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
