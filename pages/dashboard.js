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
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
        loadSubscription(data.user.id);
      }
    });
  }, []);

  async function loadSubscription(userId) {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    setSubscription(data);
  }

  async function openBillingPortal() {
    setError("");
    try {
      const res = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });

      const data = await res.json();

      if (!data.url) {
        throw new Error();
      }

      window.location.href = data.url;
    } catch {
      setError("Unable to open billing portal.");
    }
  }

  if (!user) return null;

  const isPro =
    subscription?.plan === "pro" && subscription?.status === "active";

  return (
    <div style={{ padding: 40 }}>
      <h1>Welcome to ZeusBolt ⚡</h1>
      <p>Logged in as {user.email}</p>

      {isPro ? (
        <div style={{ background: "#eaffea", padding: 20, marginTop: 20 }}>
          <p>✅ <strong>Pro plan active</strong></p>
          <button onClick={openBillingPortal}>Manage Billing</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      ) : (
        <p>Free plan</p>
      )}

      <hr />
      <button onClick={() => supabase.auth.signOut()}>Log out</button>
    </div>
  );
}
