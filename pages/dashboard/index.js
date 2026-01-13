import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

// Client-side Supabase (safe with anon key)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function DashboardPage() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState("");
  const [subStatus, setSubStatus] = useState("Checking...");
  const [subPlan, setSubPlan] = useState("Pro");

  const [newIdea, setNewIdea] = useState("");
  const [projects, setProjects] = useState([]);
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [savingIdea, setSavingIdea] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const styles = useMemo(
    () => ({
      page: {
        maxWidth: 980,
        margin: "0 auto",
        padding: "28px 16px 60px",
      },
      h1: {
        fontSize: 28,
        margin: "6px 0 18px",
        color: "#ffffff",
      },
      grid: {
        display: "grid",
        gap: 16,
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      },
      card: {
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 16,
        background: "#ffffff",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      },
      cardTitle: {
        fontSize: 16,
        fontWeight: 800,
        marginBottom: 8,
        color: "#111827", // 🔑 FIXED VISIBILITY
      },
      muted: {
        color: "#4b5563", // darker grey for contrast
        fontSize: 14,
      },
      cardText: {
        color: "#111827",
        fontSize: 14,
      },
      row: {
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "wrap",
      },
      button: {
        border: "1px solid #111827",
        background: "#111827",
        color: "#ffffff",
        borderRadius: 12,
        padding: "10px 12px",
        fontWeight: 700,
        cursor: "pointer",
      },
      buttonGhost: {
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        color: "#111827",
        borderRadius: 12,
        padding: "10px 12px",
        fontWeight: 700,
        cursor: "pointer",
      },
      textarea: {
        width: "100%",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        resize: "vertical",
        outline: "none",
        color: "#111827",
      },
      list: {
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "grid",
        gap: 10,
      },
      ideaItem: {
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 12,
        background: "#f9fafb",
      },
      error: {
        color: "#b91c1c",
        fontSize: 14,
        marginTop: 10,
      },
      badge: {
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: 999,
        background: "#ecfeff",
        color: "#155e75",
        fontWeight: 800,
        fontSize: 12,
        border: "1px solid #a5f3fc",
      },
    }),
    []
  );

  useEffect(() => {
    async function init() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session) {
        router.replace("/auth");
        return;
      }

      setUserEmail(session.user.email || "");

      const { data: subRow } = await supabase
        .from("subscriptions")
        .select("status, plan")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setSubStatus(subRow?.status ? capitalize(subRow.status) : "Active");
      setSubPlan(subRow?.plan || "Pro");

      await fetchIdeas(session.access_token);
    }

    init();
  }, []);

  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  async function fetchIdeas(token) {
    setLoadingIdeas(true);
    setErrorMsg("");

    const res = await fetch("/api/projects/list", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();
    setProjects(json.projects || []);
    setLoadingIdeas(false);
  }

  async function saveIdea() {
    if (!newIdea.trim()) return;

    setSavingIdea(true);
    setErrorMsg("");

    const { data } = await supabase.auth.getSession();
    const token = data.session.access_token;

    const res = await fetch("/api/projects/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: newIdea.trim() }),
    });

    const json = await res.json();

    if (!res.ok) {
      setErrorMsg(json.error || "Failed to save idea");
    } else {
      setNewIdea("");
      await fetchIdeas(token);
    }

    setSavingIdea(false);
  }

  async function openBillingPortal() {
    const res = await fetch("/api/create-portal-session", { method: "POST" });
    const json = await res.json();
    if (json?.url) window.location.href = json.url;
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  return (
    <div style={styles.page}>
      <div style={{ marginBottom: 14 }}>
        <div style={styles.badge}>Dashboard</div>
        <h1 style={styles.h1}>Welcome, {userEmail}</h1>
        <p style={{ ...styles.muted, color: "#e5e7eb" }}>
          Manage your subscription and save your ideas.
        </p>
      </div>

      <div style={styles.grid}>
        {/* Subscription */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Subscription</div>
          <p style={styles.cardText}>Plan: <strong>{subPlan}</strong></p>
          <p style={styles.cardText}>Status: <strong>{subStatus}</strong></p>

          <div style={styles.row}>
            <button style={styles.button} onClick={openBillingPortal}>
              Manage billing
            </button>
            <button style={styles.buttonGhost} onClick={signOut}>
              Sign out
            </button>
          </div>

          {errorMsg && <div style={styles.error}>{errorMsg}</div>}
        </div>

        {/* Ideas */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Your Ideas</div>
          <p style={styles.muted}>Save quick notes here. Only you can see them.</p>

          <textarea
            style={styles.textarea}
            rows={4}
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            placeholder="Describe your idea..."
          />

          <div style={{ ...styles.row, justifyContent: "space-between", marginTop: 10 }}>
            <button
              style={styles.button}
              onClick={saveIdea}
              disabled={savingIdea}
            >
              {savingIdea ? "Saving..." : "Save idea"}
            </button>

            <span style={styles.muted}>{projects.length} saved</span>
          </div>

          <div style={{ marginTop: 12 }}>
            {loadingIdeas ? (
              <p style={styles.muted}>Loading...</p>
            ) : projects.length === 0 ? (
              <p style={styles.muted}>No ideas yet.</p>
            ) : (
              <ul style={styles.list}>
                {projects.map((p) => (
                  <li key={p.id} style={styles.ideaItem}>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {new Date(p.created_at).toLocaleString()}
                    </div>
                    <div style={styles.cardText}>{p.content}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
