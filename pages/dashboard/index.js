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
    return <div style={{ padding: 40 }}>Loading dashboard…</div>;
  }

  return (
    <div>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 32px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* BRAND: ZeusBolt text, then logo lying flat under it */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            lineHeight: 1.1,
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 800 }}>ZeusBolt</span>

          <img
            src="/zeusbolt-logo.png"
            alt="ZeusBolt lightning bolt logo"
            style={{
              width: 120,          // makes it stand out
              height: 40,          // keeps it compact
              marginTop: 6,
              objectFit: "contain",
              display: "block",
              transform: "rotate(90deg)", // makes the bolt lie flat (horizontal)
              transformOrigin: "left center",
            }}
          />
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span>{user.email}</span>
          <button onClick={openBillingPortal}>Billing</button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: 40 }}>
        <h1>Dashboard</h1>

        <div style={{ marginTop: 24 }}>
          <h3>Subscription</h3>

          {subscription ? (
            <>
              <p>
                <strong>Plan:</strong> Pro
              </p>
              <p>
                <strong>Status:</strong> Active
              </p>
              <button onClick={openBillingPortal}>Manage Billing</button>
            </>
          ) : (
            <p>No active subscription</p>
          )}
        </div>

        <div style={{ marginTop: 40 }}>
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
    </div>
  );
}
