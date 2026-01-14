import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

export default function Header() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      console.error("Missing Supabase public env vars");
      return;
    }

    const supabase = createClient(url, anonKey);

    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        console.error("Auth error:", error.message);
        return;
      }
      setUser(data?.user || null);
    });
  }, []);

  const openBillingPortal = async () => {
    if (!user) return;

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

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 32px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {/* BRAND LOGO */}
      <Link href="/" style={{ textDecoration: "none" }}>
        <img
          src="/zeusbolt.png"
          alt="ZeusBolt logo"
          style={{
            height: 256,
            maxHeight: "30vh",
            width: "auto",
            display: "block",
            cursor: "pointer",
          }}
        />
      </Link>

      {/* ACTIONS (ONLY WHEN LOGGED IN) */}
      {user && (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 14, opacity: 0.9 }}>
            {user.email}
          </span>

          <button onClick={openBillingPortal}>
            Billing
          </button>
        </div>
      )}
    </header>
  );
}
