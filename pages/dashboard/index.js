import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState(null);
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

    async function load() {
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

      setUserEmail(session.user.email);

      const subResp = await supabase
        .from("subscriptions")
        .select("plan, status, stripe_customer_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!cancelled) {
        setSubscription(subResp?.data ?? null);
        setLoading(false);
      }
    }

    load();
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

      {userEmail ? (
        <>
          <p>
            Logged in as: <strong>{userEmail}</strong>
          </p>

          <h3>Subscription</h3>

          {subscription ? (
            <ul>
              <li>
                <strong>Plan:</strong> {subscription.plan || "free"}
              </li>
              <li>
                <strong>Status:</strong> {subscription.status || "none"}
              </li>
              <li>
                <strong>Stripe customer:</strong>{" "}
                {subscription.stripe_customer_id || "(not created yet)"}
              </li>
            </ul>
          ) : (
            <p>No subscription row found (free user)</p>
          )}
        </>
      ) : (
        <p>No user logged in</p>
      )}
    </div>
  );
}

