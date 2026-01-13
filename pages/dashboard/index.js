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
    const getUserAndSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
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

    getUserAndSubscription();
  }, [router]);

  const openBillingPortal = async () => {
    if (!user) {
      alert("User not loaded yet. Please wait.");
      return;
    }

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
    return <p>Loading dashboard...</p>;
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Dashboard</h1>

      {subscription ? (
        <>
          <p>
            <strong>Plan:</strong> Pro
          </p>
          <p>
            <strong>Status:</strong> Active
          </p>

          <button onClick={openBillingPortal}>
            Manage Billing
          </button>
        </>
      ) : (
        <p>No active subscription</p>
      )}
    </div>
  );
}
