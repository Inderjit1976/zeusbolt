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
    return <div className="container section">Loading dashboard…</div>;
  }

  return (
    <div className="shell">
      {/* Header */}
      <header className="nav">
        <div className="container navRow">
          <div className="brand">
            <div className="logoMark" />
            <span>ZeusBolt</span>
          </div>

          <div className="navLinks">
            <span className="chip">{user.email}</span>
            <button className="btn" onClick={openBillingPortal}>
              Billing
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="section">
        <div className="container">
          <h1 className="h1">Dashboard</h1>

          <div style={{ height: 24 }} />

          <div className="grid2">
            {/* Subscription Card */}
            <div className="card">
              <div className="cardPad">
                <div className="kicker">
                  <span className="bullet" />
                  Subscription
                </div>

                {subscription ? (
                  <>
                    <p className="p">
                      <strong>Plan:</strong> Pro
                    </p>
                    <p className="p">
                      <strong>Status:</strong> Active
                    </p>

                    <div style={{ marginTop: 18 }}>
                      <button
                        className="btn btnPrimary"
                        onClick={openBillingPortal}
                      >
                        Manage Billing
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="p">No active subscription</p>
                )}
              </div>
            </div>

            {/* Account Card */}
            <div className="card">
              <div className="cardPad">
                <div className="kicker">
                  <span className="bullet" />
                  Account
                </div>

                <p className="p">
                  Signed in as:
                  <br />
                  <strong>{user.email}</strong>
                </p>

                <div style={{ marginTop: 18 }}>
                  <button
                    className="btn"
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
          </div>
        </div>
      </main>
    </div>
  );
}
