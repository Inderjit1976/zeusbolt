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
      h1: { fontSize: 28, margin: "6px 0 18px" },
      grid: {
        display: "grid",
        gap: 16,
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      },
      card: {
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 16,
        background: "#fff",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      },
      cardTitle: { fontSize: 16, fontWeight: 800, marginBottom: 8 },
      muted: { color: "#6b7280", fontSize: 14 },
      row: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
      button: {
        border: "1px solid #111827",
        background: "#111827",
        color: "#fff",
        borderRadius: 12,
        padding: "10px 12px",
        fontWeight: 700,
        cursor: "pointer",
      },
      buttonGhost: {
        border: "1px solid #e5e7eb",
        background: "#fff",
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
      },
      list: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 },
      ideaItem: {
        border: "1px solid #eee",
        borderRadius: 12,
        padding: 12,
        background: "#fafafa",
      },
      error: { color: "#b91c1c", fontSize: 14, marginTop: 10 },
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

  // 1) Require login, load profile + subscription + ideas
  useEffect(() => {
    let mounted = true;

    async function init() {
      setErrorMsg("");

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session) {
        router.replace("/auth");
        return;
      }

      if (!mounted) return;

      setUserEmail(session.user?.email || "");

      // Load subscription status from Supabase
      // Expectation from your handover: one active Pro row per user in `subscriptions`.
      const { data: subRow, error: subErr } = await supabase
        .from("subscriptions")
        .select("status, plan")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subErr) {
        // Don't block dashboard if this fails
        setSubStatus("Unknown");
      } else {
        setSubStatus(subRow?.status ? capitalize(subRow.status) : "Inactive");
        setSubPlan(subRow?.plan ? String(subRow.plan) : "Pro");
      }

      await fetchIdeas(session.access_token, session.user.id);
    }

    init();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function capitalize(s) {
    if (!s || typeof s !== "string") return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  async function fetchIdeas(accessToken) {
    setLoadingIdeas(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/projects/list", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json?.error || "Failed to load ideas.");
        setProjects([]);
      } else {
        setProjects(Array.isArray(json.projects) ? json.projects : []);
      }
    } catch (e) {
      setErrorMsg("Failed to load ideas.");
      setProjects([]);
    } finally {
      setLoadingIdeas(false);
    }
  }

  async function handleSaveIdea() {
    const trimmed = newIdea.trim();
    if (!trimmed) return;

    setSavingIdea(true);
    setErrorMsg("");

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session?.access_token) {
      router.replace("/auth");
      return;
    }

    try {
      const res = await fetch("/api/projects/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ content: trimmed }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json?.error || "Failed to save idea.");
      } else {
        setNewIdea("");
        await fetchIdeas(session.access_token);
      }
    } catch (e) {
      setErrorMsg("Failed to save idea.");
    } finally {
      setSavingIdea(false);
    }
  }

  async function openBillingPortal() {
    setErrorMsg("");

    try {
      const res = await fetch("/api/create-portal-session", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json?.error || "Failed to open billing portal.");
        return;
      }

      if (json?.url) {
        window.location.href = json.url;
      } else {
        setErrorMsg("Billing portal URL missing.");
      }
    } catch (e) {
      setErrorMsg("Failed to open billing portal.");
    }
  }

  async function signOut() {
    setErrorMsg("");
    await supabase.auth.signOut();
    router.replace("/");
  }

  return (
    <div style={styles.page}>
      <div style={{ marginBottom: 14 }}>
        <div style={styles.badge}>Dashboard</div>
        <h1 style={styles.h1}>Welcome{userEmail ? `, ${userEmail}` : ""}</h1>
        <p style={styles.muted}>
          Manage your subscription and save your ideas. Your global header remains unchanged.
        </p>
      </div>

      <div style={styles.grid}>
        {/* Subscription card */}
        <div style={styles.card} className="card">
          <div style={styles.cardTitle}>Subscription</div>
          <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
            <div style={styles.muted}>
              Plan: <strong style={{ color: "#111827" }}>{subPlan || "Pro"}</strong>
            </div>
            <div style={styles.muted}>
              Status: <strong style={{ color: "#111827" }}>{subStatus}</strong>
            </div>
          </div>

          <div style={styles.row}>
            <button style={styles.button} onClick={openBillingPortal}>
              Manage billing
            </button>
            <button style={styles.buttonGhost} onClick={signOut}>
              Sign out
            </button>
          </div>

          {errorMsg ? <div style={styles.error}>{errorMsg}</div> : null}
        </div>

        {/* Ideas / Projects card */}
        <div style={styles.card} className="card">
          <div style={styles.cardTitle}>Your Ideas</div>
          <p style={{ ...styles.muted, marginBottom: 10 }}>
            Save quick notes here. Only you can see them.
          </p>

          <textarea
            style={styles.textarea}
            rows={4}
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            placeholder="Describe your idea..."
          />

          <div style={{ ...styles.row, marginTop: 10, justifyContent: "space-between" }}>
            <button
              style={{
                ...styles.button,
                opacity: savingIdea || !newIdea.trim() ? 0.6 : 1,
                cursor: savingIdea || !newIdea.trim() ? "not-allowed" : "pointer",
              }}
              onClick={handleSaveIdea}
              disabled={savingIdea || !newIdea.trim()}
            >
              {savingIdea ? "Saving..." : "Save idea"}
            </button>

            <div style={styles.muted}>
              {loadingIdeas ? "Loading..." : `${projects.length} saved`}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            {loadingIdeas ? (
              <div style={styles.muted}>Loading your ideas...</div>
            ) : projects.length === 0 ? (
              <div style={styles.muted}>No ideas yet.</div>
            ) : (
              <ul style={styles.list}>
                {projects.slice(0, 10).map((p) => (
                  <li key={p.id} style={styles.ideaItem}>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                      {p.created_at ? new Date(p.created_at).toLocaleString() : ""}
                    </div>
                    <div style={{ fontSize: 14, color: "#111827", whiteSpace: "pre-wrap" }}>
                      {p.content}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {errorMsg ? <div style={styles.error}>{errorMsg}</div> : null}
        </div>
      </div>
    </div>
  );
}
