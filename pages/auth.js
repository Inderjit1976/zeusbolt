"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    // 1. If user is already logged in, go to dashboard
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/dashboard");
      }
    });

    // 2. Listen for login events and redirect
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.replace("/dashboard");
      }
    });

    // 3. Cleanup listener when page unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div style={{ maxWidth: 420, margin: "96px auto", textAlign: "center" }}>
      <h1 style={{ marginBottom: 8 }}>
        Welcome to{" "}
        <span
          style={{
            background: "linear-gradient(90deg, #6ee7b7 0%, #fca5a5 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 800,
          }}
        >
          ZeusBolt
        </span>
      </h1>

      <p style={{ color: "#666", marginBottom: 24 }}>
        Log in to access your dashboard.
      </p>

      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={[]}
      />
    </div>
  );
}
