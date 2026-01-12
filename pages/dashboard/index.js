import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // 1️⃣ Load current session immediately
    async function loadInitialSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data } = await supabase
          .from("subscriptions")
          .select("plan, status")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        setSubscription(data);
      }

      setLoading(false);
    }

    loadInitialSession();

    // 2️⃣ Listen for future auth changes
    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data } = await supabase
          .from("subscriptions")
          .select("plan, status")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        setSubscription(data);
      } else {
        setSubscription(null);
      }
    });

    return () => authSub.unsubscribe();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("Sending magic link…");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://zeusbolt.vercel.app/dashboard",
      },
    });

    if (error) {
      setMessage("Error sending login email");
    } else {
      setMessage("Check your email for the login link 📧");
    }
  }

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

          {subscription ? (
            <ul>
              <li>
                <strong>Plan:</strong> {subscription.plan || "free"}
              </li>
              <li>
                <strong>Status:</strong> {subscription.status || "none"}
              </li>
            </ul>
          ) : (
            <p>No subscription row found (free user)</p>
          )}
        </>
      ) : (
        <>
          <p style={{ color: "red" }}>No user logged in</p>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ padding: 8, marginRight: 8 }}
            />
            <button type="submit">Log in</button>
          </form>

          {message && <p>{message}</p>}
        </>
      )}
    </div>
  );
}
