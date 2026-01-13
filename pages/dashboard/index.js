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
    <div
      style={{
        padding: "48px 32px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>
        Dashboard
      </h1>

      <div style={{ marginTop: 32 }}>
        <h3>Subscription</h3>

        {subscription ? (
          <div style={{ marginTop: 12 }}>
            <p>
              <strong>Plan:</strong> Pro
            </p>
            <p>
              <strong>Status:</strong> Active
            </p>
            <button onClick={openBillingPortal}>
              Manage billing
            </button>
          </div>
        ) : (
          <p>No active subscription</p>
        )}
      </div>

      <div style={{ marginTop: 48 }}>
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
