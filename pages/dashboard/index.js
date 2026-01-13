import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

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
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const styles = useMemo(
    () => ({
      page: { maxWidth: 980, margin: "0 auto", padding: "28px 16px 60px" },
      h1: { fontSize: 28, margin: "6px 0 18px", color: "#ffffff" },
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
      },
      cardTitle: {
        fontSize: 16,
        fontWeight: 800,
        marginBottom: 8,
        color: "#111827",
      },
      muted: { color: "#4b5563", fontSize: 14 },
      cardText: { color: "#111827", fontSize: 14 },
      row: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
      button: {
        border: "1px solid #111827",
        background: "#111827",
        color: "#ffffff",
        borderRadius: 12,
        padding: "8px 12px",
        fontWeight: 700,
        cursor: "pointer",
      },
      buttonGhost: {
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        color: "#111827",
        borderRadius: 10,
        padding: "6px 10px",
        fontWeight: 600,
        cursor: "pointer",
      },
      buttonDanger: {
        border: "1px solid #fecaca",
        background: "#ffffff",
        color: "#b91c1c",
        borderRadius: 10,
        padding: "6px 10px",
        fontWeight: 600,
        cursor: "pointer",
      },
      textarea: {
        width: "100%",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        resize: "vertical",
      },
      list: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 },
      ideaItem: {
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 12,
        background: "#f9fafb",
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

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

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

      setSubStatus(subRow?.status || "Active");
      setSubPlan(subRow?.plan || "Pro");

      await fetchIdeas(session.access_token);
    }

    init();
  }, []);

  async function fetchIdeas(token) {
    setLoadingIdeas(true);
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

    const { data } = await supabase.auth.getSession();
    const token = data.session.access_token;

    await fetch("/api/projects/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: newIdea.trim() }),
    });

    setNewIdea("");
    await fetchIdeas(token);
    setSavingIdea(false);
  }

  async function deleteIdea(id) {
    setDeletingId(id);

    const { data } = await supabase.auth.getSession();
    const token = data.session.access_token;

    await fetch("/api/projects/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });

    await fetchIdeas(token);
    setDeletingId(null);
  }

  async function updateIdea(id) {
    if (!editingText.trim()) return;

    const { data } = await supabase.auth.getSession();
    const token = data.session.access_token;

    await fetch("/api/projects/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, content: editingText.trim() }),
    });

    setEditingId(null);
    setEditingText("");
    await fetchIdeas(token);
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
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Subscription</div>
          <p style={styles.cardText}>Plan: <strong>{subPlan}</strong></p>
          <p style={styles.cardText}>Status: <strong>{subStatus}</strong></p>
          <button style={styles.button} onClick={openBillingPortal}>
            Manage billing
          </button>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>Your Ideas</div>

          <textarea
            style={styles.textarea}
            rows={3}
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            placeholder="Write a new idea..."
          />

          <button style={styles.button} onClick={saveIdea} disabled={savingIdea}>
            {savingIdea ? "Saving..." : "Save idea"}
          </button>

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

                    {editingId === p.id ? (
                      <>
                        <textarea
                          style={styles.textarea}
                          rows={3}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                        />
                        <div style={styles.row}>
                          <button
                            style={styles.button}
                            onClick={() => updateIdea(p.id)}
                          >
                            Save
                          </button>
                          <button
                            style={styles.buttonGhost}
                            onClick={() => {
                              setEditingId(null);
                              setEditingText("");
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={styles.cardText}>{p.content}</div>
                        <div style={styles.row}>
                          <button
                            style={styles.buttonGhost}
                            onClick={() => {
                              setEditingId(p.id);
                              setEditingText(p.content);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            style={styles.buttonDanger}
                            onClick={() => deleteIdea(p.id)}
                            disabled={deletingId === p.id}
                          >
                            {deletingId === p.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {errorMsg && <div style={styles.error}>{errorMsg}</div>}
        </div>
      </div>
    </div>
  );
}
