import { useEffect, useMemo, useRef, useState } from "react";
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

  // For “lively” actions
  const ideasSectionRef = useRef(null);
  const newIdeaTextareaRef = useRef(null);

  const styles = useMemo(
    () => ({
      // ✅ More breathing room + slightly wider max width
      page: { maxWidth: 1020, margin: "0 auto", padding: "40px 20px 80px" },

      // ✅ Section wrappers for consistent vertical rhythm
      topBlock: { marginBottom: 22 },
      section: { marginBottom: 26 },
      sectionTight: { marginBottom: 18 },

      // ✅ Welcome line — same brand feel as the logo (multi-stop gradient)
      h1: {
        fontSize: 30,
        margin: "6px 0 14px",
        background:
          "linear-gradient(90deg, #22c55e 0%, #facc15 40%, #fb923c 70%, #ef4444 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        fontWeight: 900,
        letterSpacing: "-0.02em",
      },

      // ✅ Badge gets breathing room
      badge: {
        display: "inline-block",
        padding: "6px 12px",
        borderRadius: 999,
        background: "rgba(34,197,94,0.10)",
        color: "#86efac",
        fontWeight: 800,
        fontSize: 12,
        border: "1px solid rgba(34,197,94,0.25)",
        marginBottom: 8,
      },

      // ✅ Grid: calmer spacing between main cards
      grid: {
        display: "grid",
        gap: 24,
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
      },

      // ✅ Cards: slightly bigger padding + radius = more premium
      card: {
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 20,
        background: "#ffffff",
      },
      cardTitle: {
        fontSize: 16,
        fontWeight: 900,
        marginBottom: 10,
        color: "#111827",
      },
      muted: { color: "#4b5563", fontSize: 14 },
      cardText: { color: "#111827", fontSize: 14 },

      row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },

      button: {
        border: "1px solid #111827",
        background: "#111827",
        color: "#ffffff",
        borderRadius: 12,
        padding: "10px 14px",
        fontWeight: 800,
        cursor: "pointer",
      },
      buttonDisabled: {
        border: "1px solid #9ca3af",
        background: "#9ca3af",
        color: "#ffffff",
        borderRadius: 12,
        padding: "10px 14px",
        fontWeight: 800,
        cursor: "not-allowed",
      },
      buttonGhost: {
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        color: "#111827",
        borderRadius: 12,
        padding: "8px 12px",
        fontWeight: 700,
        cursor: "pointer",
      },
      buttonDanger: {
        border: "1px solid #fecaca",
        background: "#ffffff",
        color: "#b91c1c",
        borderRadius: 12,
        padding: "8px 12px",
        fontWeight: 700,
        cursor: "pointer",
      },

      textarea: {
        width: "100%",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 14,
        fontSize: 14,
        resize: "vertical",
      },

      counterRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 8,
        marginBottom: 10,
      },
      counterOk: { color: "#6b7280", fontSize: 12 },
      counterBad: { color: "#b91c1c", fontSize: 12, fontWeight: 800 },

      list: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 },
      ideaItem: {
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 14,
        background: "#f9fafb",
      },
      meta: { fontSize: 12, color: "#6b7280", marginBottom: 6 },
      error: { color: "#b91c1c", fontSize: 14, marginTop: 10 },

      // ===== “LIVELY” DASHBOARD LAYER =====

      // ✅ Journey hero: more spacing, calmer layout
      heroCardWrap: {
        marginTop: 10,
        marginBottom: 18,
        borderRadius: 18,
        padding: 1,
        background:
          "linear-gradient(90deg, rgba(34,197,94,0.55), rgba(250,204,21,0.45), rgba(251,146,60,0.45), rgba(239,68,68,0.55))",
      },
      heroCard: {
        borderRadius: 18,
        padding: 18,
        background:
          "linear-gradient(180deg, rgba(17,24,39,0.88) 0%, rgba(17,24,39,0.72) 100%)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 10px 35px rgba(0,0,0,0.35)",
      },
      heroTitle: {
        color: "#ffffff",
        fontWeight: 900,
        fontSize: 16,
        marginBottom: 12,
        letterSpacing: "-0.01em",
      },
      heroSub: { color: "rgba(255,255,255,0.80)", fontSize: 13, marginTop: 12 },

      stepsRow: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 12,
        marginTop: 10,
      },
      step: {
        padding: 12,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.06)",
      },
      stepTop: { display: "flex", gap: 10, alignItems: "center", marginBottom: 6 },
      stepIcon: {
        width: 28,
        height: 28,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
        color: "#111827",
        background: "rgba(255,255,255,0.85)",
      },
      stepTitle: { color: "#ffffff", fontWeight: 900, fontSize: 13 },
      stepDesc: { color: "rgba(255,255,255,0.80)", fontSize: 12, lineHeight: 1.35 },

      // ✅ Quick actions: more breathing room
      actionsRow: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 14,
        marginBottom: 18,
      },
      actionCard: {
        borderRadius: 16,
        padding: 16,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.06)",
        boxShadow: "0 10px 25px rgba(0,0,0,0.22)",
        cursor: "pointer",
      },
      actionTitle: { color: "#ffffff", fontWeight: 900, marginBottom: 6 },
      actionText: { color: "rgba(255,255,255,0.78)", fontSize: 13, lineHeight: 1.35 },

      // ✅ Roadmap: calmer spacing + less “jammed”
      roadmapCard: {
        borderRadius: 16,
        padding: 16,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.06)",
        boxShadow: "0 10px 25px rgba(0,0,0,0.22)",
        marginBottom: 28,
      },
      roadmapTitle: { color: "#ffffff", fontWeight: 900, marginBottom: 10 },
      roadmapText: { color: "rgba(255,255,255,0.78)", fontSize: 13, lineHeight: 1.45 },
      roadmapList: {
        color: "rgba(255,255,255,0.78)",
        fontSize: 13,
        lineHeight: 1.45,
        marginTop: 10,
        marginBottom: 8,
        paddingLeft: 18,
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

  // Guided journey (simple, honest, no fake progress)
  const hasAnyIdeas = projects.length > 0;
  const currentStepLabel = hasAnyIdeas ? "Refine your idea" : "Capture your idea";
  const heroHint = hasAnyIdeas
    ? "Next: pick one idea and sharpen the problem, audience, and value."
    : "Start by saving your first idea — even rough notes are perfect.";

  function scrollToIdeas() {
    if (ideasSectionRef.current) {
      ideasSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function focusNewIdea() {
    scrollToIdeas();
    setTimeout(() => {
      if (newIdeaTextareaRef.current) newIdeaTextareaRef.current.focus();
    }, 250);
  }

  return (
   <div style={styles.page}>
      {/* ===== TOP: badge + welcome + journey zone ===== */}
      <div style={styles.topBlock}>
        <div style={styles.badge}>Dashboard</div>
        <h1 style={styles.h1}>Welcome, {userEmail}</h1>

        {/* ===== Journey Hero Card ===== */}
        <div style={styles.heroCardWrap}>
          <div style={styles.heroCard}>
            <div style={styles.heroTitle}>Your ZeusBolt Journey</div>

            <div style={styles.stepsRow}>
              <div style={styles.step}>
                <div style={styles.stepTop}>
                  <div style={styles.stepIcon}>{hasAnyIdeas ? "✓" : "1"}</div>
                  <div style={styles.stepTitle}>Capture your idea</div>
                </div>
                <div style={styles.stepDesc}>
                  Write the rough version. No pressure — clarity comes later.
                </div>
              </div>

              <div style={styles.step}>
                <div style={styles.stepTop}>
                  <div style={styles.stepIcon}>{hasAnyIdeas ? "⏳" : "2"}</div>
                  <div style={styles.stepTitle}>Refine your idea</div>
                </div>
                <div style={styles.stepDesc}>
                  Turn it into something clear: problem, audience, value.
                </div>
              </div>

              <div style={styles.step}>
                <div style={styles.stepTop}>
                  <div style={styles.stepIcon}>🔒</div>
                  <div style={styles.stepTitle}>Generate a blueprint</div>
                </div>
                <div style={styles.stepDesc}>
                  Planned next: structured blueprint workflows and build steps.
                </div>
              </div>
            </div>

            <div style={styles.heroSub}>
              <strong style={{ color: "#ffffff" }}>Current focus:</strong>{" "}
              {currentStepLabel}. {heroHint}
            </div>
          </div>
        </div>

        {/* ===== Quick Actions ===== */}
        <div style={styles.actionsRow}>
          <div
            style={styles.actionCard}
            onClick={scrollToIdeas}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") scrollToIdeas();
            }}
          >
            <div style={styles.actionTitle}>✍️ Refine an idea</div>
            <div style={styles.actionText}>
              Pick one idea and tighten it into something clearer and stronger.
            </div>
          </div>

          <div
            style={styles.actionCard}
            onClick={focusNewIdea}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") focusNewIdea();
            }}
          >
            <div style={styles.actionTitle}>➕ Start a new idea</div>
            <div style={styles.actionText}>
              Capture a fresh thought — short, messy notes are welcome.
            </div>
          </div>

          <div style={styles.actionCard}>
            <div style={styles.actionTitle}>⚡ What’s next?</div>
            <div style={styles.actionText}>
              Blueprints, guided refinement, and new builder tools are being shaped now.
            </div>
          </div>
        </div>

        {/* ===== What we’re working on ===== */}
        <div style={styles.roadmapCard}>
          <div style={styles.roadmapTitle}>What we’re working on</div>
          <div style={styles.roadmapText}>
            We’re carefully building the next steps to help you go further with your ideas.
          </div>
          <ul style={styles.roadmapList}>
            <li>Turning ideas into clear, structured projects</li>
            <li>Guided refinement to sharpen problem, audience, and value</li>
            <li>Optional tools for brand and asset exploration</li>
          </ul>
          <div style={styles.roadmapText}>(Nothing is rushed — quality comes first.)</div>
        </div>
      </div>

      {/* ===== Existing grid (kept) ===== */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Subscription</div>
          <p style={styles.cardText}>
            Plan: <strong>{subPlan}</strong>
          </p>
          <p style={styles.cardText}>
            Status: <strong>{subStatus}</strong>
          </p>
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

        <div style={styles.card} ref={ideasSectionRef}>
          <div style={styles.cardTitle}>Your Ideas</div>

          <textarea
            ref={newIdeaTextareaRef}
            style={styles.textarea}
            rows={3}
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                if (!saveDisabled) saveIdea();
              }
            }}
            placeholder="Write a new idea..."
          />

          <div style={styles.counterRow}>
            <span style={newTooLong ? styles.counterBad : styles.counterOk}>
              {newLen}/{MAX_LEN}
              {newTooLong ? " (too long)" : ""}
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

          <div style={{ marginTop: 14 }}>
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
                          onKeyDown={(e) => {
                            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                              e.preventDefault();
                              if (!editSaveDisabled) updateIdea(p.id);
                            }
                          }}
                        />

                        <div style={styles.counterRow}>
                          <span style={editTooLong ? styles.counterBad : styles.counterOk}>
                            {editLen}/{MAX_LEN}
                            {editTooLong ? " (too long)" : ""}
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
