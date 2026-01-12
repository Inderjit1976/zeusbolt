import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUser(user);

      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setSubscription(data);
    };

    loadData();
  }, []);

  const startCheckout = async () => {
    setError("");
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
      });

      const data = await res.json();

      if (!data.url) throw new Error("No checkout URL");

      window.location.href = data.url;
    } catch (err) {
      setError("Unable to start checkout");
    }
  };

  const openBillingPortal = async () => {
    setError("");
    try {
      const res = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });

      const data = await res.json();

      if (!data.url) throw new Error("No portal URL");

      window.location.href = data.url;
    } catch (err) {
      setError("Unable to open billing portal");
    }
  };

  if (!user) return <p>Loading...</p>;

  const isPro = subscription?.plan === "pro" && subscription?.status === "active";

  return (
    <div style={{ padding: 40 }}>
      <h1>Welcome to ZeusBolt ⚡</h1>
      <p>Logged in as {user.email}</p>

      {isPro ? (
        <div style={{ background: "#eaffea", padding: 20, marginTop: 20 }}>
          <p>✅ Pro plan active</p>
          <button onClick={openBillingPortal}>Manage Billing</button>
        </div>
      ) : (
        <div style={{ background: "#fff4e5", padding: 20, marginTop: 20 }}>
          <p>Free plan</p>
          <button onClick={startCheckout}>Upgrade to Pro</button>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button style={{ marginTop: 40 }} onClick={() => supabase.auth.signOut()}>
        Log out
      </button>
    </div>
  );
}
