"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

// Create Supabase client using environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AuthPage() {
  const router = useRouter();

  // If user is already logged in, send them to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/dashboard");
      }
    });
  }, [router]);

  return (
    <div style={{ maxWidth: 420, margin: "96px auto", textAlign: "center" }}>
      <h1 style={{ marginBottom: 8 }}>Welcome to ZeusBolt</h1>
      <p style={{ marginBottom: 24, color: "#666" }}>
        Log in to access your dashboard.
        <br />
        If your details are incorrect, an error message will appear below.
      </p>

      {/* Supabase Auth UI
          - Handles login & signup
          - Shows error messages automatically
      */}
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={[]}
      />
    </div>
  );
}



