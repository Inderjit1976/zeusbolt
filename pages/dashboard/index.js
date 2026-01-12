import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseAnon) return null;
    return createClient(supabaseUrl, supabaseAnon);
  }, [supabaseUrl, supabaseAnon]);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const session = data?.session ?? null;

      if (!session) {
        setLoading(false);
        return;
      }

      setUser(session.user);

      const { data: subData } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cancelled) {
        setSubscription(subData ?? null);
        setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  if (loading) {
    return <p style={{ padding: 20 }}>Loading dashboard…</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>ZeusBolt Dashboard</h1>

      {user ? (
        <>
          <p>
            Logged in as: <strong>{user.email}</strong>
          </p>

          <h3>Subscription</h3>

          {subscription && subscription.plan === "pro" ? (
            <>
              <p>
                <strong>Plan:</strong> Pro
              </p>
              <p>
                <strong>Billing status:</strong> Active (managed by Stripe)
              </p>

              <form action="/api/create-portal-session" method="POST">
                <button style={{ marginTop: 12 }}>
                  Manage billing
                </button>
              </form>
            </>
          ) : (
            <>
              <p>
                <strong>Plan:</strong> Free
              </p>
              <p>
                <strong>Status:</strong> Inactive
              </p>

              <form action="/api/create-checkout-session" method="POST">
                <button style={{ marginTop: 12 }}>
                  Upgrade to Pro
                </button>
              </form>
            </>
          )}
        </>
      ) : (
        <p>No user logged in</p>
      )}
    </div>
  );
}
