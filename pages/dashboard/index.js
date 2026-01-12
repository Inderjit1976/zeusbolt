import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function Dashboard() {
  const [status, setStatus] = useState("Starting…");

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setStatus("❌ Supabase env vars are missing at runtime");
      return;
    }

    setStatus("✅ Supabase env vars found, creating client…");

    const supabase = createClient(supabaseUrl, supabaseKey);

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          setStatus("❌ Supabase error: " + error.message);
          return;
        }

        if (data.session) {
          setStatus("✅ Session loaded for user: " + data.session.user.email);
        } else {
          setStatus("ℹ️ No session found (user not logged in)");
        }
      })
      .catch((err) => {
        setStatus("❌ Unexpected error: " + err.message);
      });
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>ZeusBolt Dashboard</h1>
      <p>{status}</p>
    </div>
  );
}
