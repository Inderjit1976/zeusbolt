import { useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

const MAX_LEN = 2000;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function HomePage() {
  const router = useRouter();

  const [idea, setIdea] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const len = idea.length;
  const tooLong = len > MAX_LEN;

  async function handleStart() {
    setError("");

    const trimmed = idea.trim();
    if (!trimmed) {
      setError("Please write something first.");
      return;
    }

    if (trimmed.length > MAX_LEN) {
      setError("Idea is too long.");
      return;
    }

    const { data } = await supabase.auth.getSession();
    const session = data?.session;

    if (!session) {
      router.push("/auth");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/projects/create-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ content: trimmed }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json?.error || "Failed to save draft");
        setSaving(false);
        return;
      }

      // Success → go to dashboard
      router.push("/dashboard");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "60px 16px" }}>
      {/* HERO */}
      <section style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 12 }}>
          Build your next SaaS idea
        </h1>
        <p style={{ fontSize: 18, color: "#6b7280", maxWidth: 600 }}>
          ZeusBolt helps you turn ideas into real products — faster and with
          clarity.
        </p>
      </section>

      {/* IDEA TEASER */}
      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 20,
          background: "#ffffff",
          maxWidth: 700,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Describe your idea
        </h2>

        <textarea
          rows={5}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="e.g. A tool that helps freelancers track invoices automatically..."
          style={{
            width: "100%",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 12,
            fontSize: 14,
            resize: "vertical",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: tooLong ? "#b91c1c" : "#6b7280",
            }}
          >
            {len}/{MAX_LEN}
            {tooLong ? " (too long)" : ""}
          </span>

          <button
            onClick={handleStart}
            disabled={saving || tooLong}
            style={{
              border: "1px solid #111827",
              background: saving || tooLong ? "#9ca3af" : "#111827",
              color: "#ffffff",
              borderRadius: 12,
              padding: "10px 14px",
              fontWeight: 700,
              cursor: saving || tooLong ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving..." : "Get started"}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 10, color: "#b91c1c", fontSize: 14 }}>
            {error}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer style={{ marginTop: 60, color: "#9ca3af", fontSize: 14 }}>
        © {new Date().getFullYear()} ZeusBolt
      </footer>
    </main>
  );
}
