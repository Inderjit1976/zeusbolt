import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

function withTimeout(promise, ms, label = "Operation") {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

export default function Dashboard() {
  const [phase, setPhase] = useState("BOOT");
  const [details, setDetails] = useState("");
  const [userEmail, setUserEmail] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [done, setDone] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseAnon) return null;
    return createClient(supabaseUrl, supabaseAnon);
  }, [supabaseUrl, supabaseAnon]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setPhase("CHECK_ENV");
        setDetails("Checking NEXT_PUBLIC_SUPABASE_* variables…");

        if (!supabaseUrl || !supabaseAnon) {
          setPhase("ENV_MISSING");
          setDetails("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY at runtime.");
          return;
        }

        if (!supabase) {
          setPhase("CLIENT_FAIL");
          setDetails("Supabase client failed to initialize.");
          return;
        }

        setPhase("GET_SESSION");
        setDetails("Fetching session from Supabase (max 8s)…");

        const sessionResp = await withTimeout(
          supabase.auth.getSession(),
          8000,
          "getSession()"
        );

        if (cancelled) return;

        const session = sessionResp?.data?.session ?? null;
        const email = session?.user?.email ?? null;

        if (!email) {
          setPhase("NO_SESSION");
          setDetails("No session found. You are logged out (this is OK).");
          return;
        }

        setUserEmail(email);
        setPhase("SESSION_OK");
        setDetails(`Session loaded for ${email}`);

        setPhase("FETCH_SUB");
        setDetails("Loading subscription row from Supabase (max 8s)…");

        const subResp = await withTimeout(
          supabase
            .from("subscriptions")
            .select("plan, status, stripe_customer_id")
            .eq("user_id", session.user.id)
            .maybeSingle(),
          8000,
          "subscriptions query"
        );

        if (cancelled) return;

        if (subResp?.error) {
          setPhase("SUB_ERROR");
          setDetails(`Supabase query error: ${subResp.error.message}`);
          return;
        }

        setSubscription(subResp?.data ?? null);
        setPhase("DONE");
        setDetails("Dashboard loaded successfully.");
      } catch (err) {
        if (cancelled) return;
        setPhase("ERROR");
        setDetails(err?.message || String(err));
      } finally {
        if (!cancelled) setDone(true);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [supabase, supabaseUrl, supabaseAnon]);

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, Arial" }}>
      <h1>ZeusBolt Dashboard</h1>

      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, marginTop: 12 }}>
        <div style={{ fontWeight: 700 }}>Status</div>
        <div style={{ marginTop: 6 }}>
          <div><strong>Phase:</strong> {phase}</div>
          <div><strong>Details:</strong> {details}</div>
          <div><strong>Done:</strong> {done ? "YES" : "NO"}</div>
        </div>
      </div>

      {userEmail && (
        <div style={{ marginTop: 16 }}>
          <p>
            Logged in as: <strong>{userEmail}</strong>
          </p>

          <h3>Subscription</h3>
          {subscription ? (
            <ul>
              <li><strong>Plan:</strong> {subscription.plan || "free"}</li>
              <li><strong>Status:</strong> {subscription.status || "none"}</li>
              <li><strong>stripe_customer_id:</strong> {subscription.stripe_customer_id || "(empty)"}</li>
            </ul>
          ) : (
            <p>No subscription row found for this user (free user is fine).</p>
          )}
        </div>
      )}

      {!userEmail && done && (
        <div style={{ marginTop: 16 }}>
          <p>You are logged out. (That’s fine for now.)</p>
          <p>
            If you want login back on this screen, tell me and I’ll add it in one step.
          </p>
        </div>
      )}
    </div>
  );
}
