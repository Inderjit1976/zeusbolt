import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

const MAX_LEN = 2000;

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
      buttonDisabled: {
        border: "1px solid #9ca3af",
        background: "#9ca3af",
        color: "#ffffff",
        borderRadius: 12,
        padding: "8px 12px",
        fontWeight: 700,
        cursor: "not-allowed",
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
      counterRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 8,
      },
      counterOk: { color: "#6b7280", fontSize: 12 },
      counterBad: { color: "#b91c1c", fontSize: 12, fontWeight: 700 },
      list: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 },
      ideaItem: {
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 12,
        background: "#f9fafb",
      },
      meta: { fontSize: 12, color: "#6b7280", marginBottom: 6 },
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

  const newLen = newIdea.length;
  const newTooLong = newLen > MAX_LEN;

  const editLen = editingText.length;
  const editTooLong = editLen > MAX_LEN;

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
    const trimmed = newIdea.trim();
    if (!trimmed || trimmed.length > MAX_LEN) return;

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
      body: JSON.stringify({ content: trimmed }),
    });

    const json = await res.json();
    if (!res.ok) {
      setErrorMsg(json?.error || "Failed to save idea");
    } else {
      setNewIdea("");
      await fetchIdeas(token);
    }

    setSavingIdea(false);
  }

  async function deleteIdea(id) {
    setDeletingId(id);
    setErrorMsg("");

    const { data } = await supabase.auth.getSession();
    const token = data.session.access_token;

    const res = await fetch("/api/projects/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });

    const json = await res.json();
    if (!res.ok) setErrorMsg(json?.error || "Failed to delete idea");
    await fetchIdeas(token);

    setDeletingId(null);
  }

  async function updateIdea(id) {
    const trimmed = editingText.trim();
    if (!trimmed || trimmed.length > MAX_LEN) return;

    setErrorMsg("");

    const { data } = await supabase.auth.getSession();
    const token = data.session.access_token;

    const res = await fetch("/api/projects/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, content: trimmed }),
    });

    const json = await res.json();
    if (!res.ok) {
      setErrorMsg(json?.error || "Failed to update idea");
      return;
    }

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

  const saveDisabled = savingIdea || !newIdea.trim() || newTooLong;
  const editSaveDisabled = !editingText.trim() || editTooLong;

  function formatMeta(p) {
    if (p.updated_at && p.updated_at !== p.created_at) {
      return `Edited ${new Date(p.updated_at).toLocaleString()}`;
    }
    return `Created ${new Date(p.created_at).toLocaleString()}`;
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

        <div style={styles.card}>
          <div style={styles.cardTitle}>Your Ideas</div>

          <textarea
            style={styles.textarea}
            rows={3}
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            placeholder="Write a new idea..."
          />

          <div style={styles.counterRow}>
            <span style={newTooLong ? styles.counterBad : styles.counterOk}>
              {newLen}/{MAX_LEN}{newTooLong ? " (too long)" : ""}
            </span>
            <span style={styles.muted}>Only you can see these.</span>
          </div>

          <button
            style={saveDisabled ? styles.buttonDisabled : styles.button}
            onClick={saveIdea}
            disabled={saveDisabled}
          >
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
                    <div style={styles.meta}>{formatMeta(p)}</div>

                    {editingId === p.id ? (
                      <>
                        <textarea
                          style={styles.textarea}
                          rows={3}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                        />

                        <div style={styles.counterRow}>
                          <span style={editTooLong ? styles.counterBad : styles.counterOk}>
                            {editLen}/{MAX_LEN}{editTooLong ? " (too long)" : ""}
                          </span>
                          <span style={styles.muted}>Editing</span>
                        </div>

                        <div style={styles.row}>
                          <button
                            style={editSaveDisabled ? styles.buttonDisabled : styles.button}
                            onClick={() => updateIdea(p.id)}
                            disabled={editSaveDisabled}
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
                              setEditingText(p.content || "");
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

          {errorMsg ? <div style={styles.error}>{errorMsg}</div> : null}
        </div>
      </div>
    </div>
  );
}
