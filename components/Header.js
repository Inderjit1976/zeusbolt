import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Header() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
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
    <div
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
            height: 48,
            width: "auto",
            display: "block",
            cursor: "pointer",
          }}
        />
      </Link>

      {/* ACTIONS */}
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
    </div>
  );
}
