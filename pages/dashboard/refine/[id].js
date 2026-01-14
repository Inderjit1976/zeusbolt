import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Header from "../../../components/Header";

// ---------- helpers ----------
const MAX_LEN = 500;

function clampText(value, max = MAX_LEN) {
  if (typeof value !== "string") return "";
  return value.slice(0, max);
}

/**
 * If the project already contains a structured refinement, try to prefill the fields.
 * This is intentionally forgiving (no schema changes, no strict format dependency).
 */
function parseRefinement(content) {
  const safe = typeof content === "string" ? content : "";

  const pick = (label) => {
    // Supports both "Target user:" and "Target user" (with newline)
    const re = new RegExp(
      String.raw`${label}\s*:\s*\n?([\s\S]*?)(\n{2,}|$)`,
      "i"
    );
    const m = safe.match(re);
    return m?.[1]?.trim() || "";
  };

  // Try both label styles; fall back to empty
  return {
    targetUser: pick("Target user") || pick("Who is this for"),
    problem: pick("Problem") || pick("What problem does it solve"),
    differentiation: pick("Differentiation") || pick("What makes it different"),
    simplestVersion: pick("Simplest version") || pick("What is the simplest version"),
  };
}

function buildRefinedContent({ targetUser, problem, differentiation, simplestVersion }) {
  return [
    "IDEA REFINEMENT",
    "",
    "Target user:",
    targetUser.trim(),
    "",
    "Problem:",
    problem.trim(),
    "",
    "Differentiation:",
    differentiation.trim(),
    "",
    "Simplest version:",
    simplestVersion.trim(),
    "",
  ].join("\n");
}

function Badge({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        color: "rgba(255,255,255,0.85)",
      }}
    >
      {children}
    </span>
  );
}

function QuestionBlock({
  label,
  helper,
  value,
  onChange,
  placeholder,
  maxLen = MAX_LEN,
}) {
  const remaining = maxLen - (value?.length || 0);

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.25)",
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
      }}
    >
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "white" }}>{label}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
          {helper}
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(clampText(e.target.value, maxLen))}
        placeholder={placeholder}
        rows={4}
        maxLength={maxLen}
        style={{
          width: "100%",
          resize: "vertical",
          borderRadius: 12,
          padding: 12,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(0,0,0,0.35)",
          color: "white",
          outline: "none",
          lineHeight: 1.45,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 8,
          fontSize: 12,
          color: remaining < 50 ? "rgba(255,170,0,0.95)" : "rgba(255,255,255,0.55)",
        }}
        aria-live="polite"
      >
        {value.length}/{maxLen}
      </div>
    </div>
  );
}

// ---------- page ----------
export default function RefineIdeaPage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [projectId, setProjectId] = useState(null);
  const [projectStatus, setProjectStatus] = useState(null);

  const [targetUser, setTargetUser] = useState("");
  const [problem, setProblem] = useState("");
  const [differentiation, setDifferentiation] = useState("");
  const [simplestVersion, setSimplestVersion] = useState("");

  const canSave = useMemo(() => {
    // Soft requirement: at least one field has content
    return (
      (targetUser || "").trim().length > 0 ||
      (problem || "").trim().length > 0 ||
      (differentiation || "").trim().length > 0 ||
      (simplestVersion || "").trim().length > 0
    );
  }, [targetUser, problem, differentiation, simplestVersion]);

  useEffect(() => {
    if (!router.isReady) return;
    if (!id || typeof id !== "string") return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        // Reuse existing API: list everything, then pick the right project.
        // This avoids adding a new API route and keeps the locked backend stable.
        const res = await fetch("/api/projects/list", { method: "GET" });

        if (res.status === 401) {
          router.replace("/auth");
          return;
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load your ideas.");
        }

        // Expecting: data.projects (based on typical pattern)
        const projects = Array.isArray(data?.projects) ? data.projects : [];

        const found = projects.find((p) => p.id === id);
        if (!found) {
          router.replace("/dashboard");
          return;
        }

        if (cancelled) return;

        setProjectId(found.id);
        setProjectStatus(found.status || null);

        // Prefill from parsed content if possible
        const parsed = parseRefinement(found.content || "");
        setTargetUser(clampText(parsed.targetUser));
        setProblem(clampText(parsed.problem));
        setDifferentiation(clampText(parsed.differentiation));
        setSimplestVersion(clampText(parsed.simplestVersion));
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || "Something went wrong. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, id, router]);

  async function handleSave() {
    if (!projectId) return;

    setSaving(true);
    setError("");

    try {
      const refinedContent = buildRefinedContent({
        targetUser,
        problem,
        differentiation,
        simplestVersion,
      });

      const res = await fetch("/api/projects/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: projectId,
          content: refinedContent,
          status: "refined",
        }),
      });

      if (res.status === 401) {
        router.replace("/auth");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save. Please try again.");
      }

      router.push("/dashboard");
    } catch (e) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push("/dashboard");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 15% 10%, rgba(46, 255, 182, 0.12), transparent 55%), radial-gradient(1000px 500px at 80% 20%, rgba(255, 200, 0, 0.10), transparent 55%), radial-gradient(900px 500px at 50% 90%, rgba(255, 68, 0, 0.10), transparent 55%), #07070B",
        color: "white",
      }}
    >
      <Header />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 16px 70px" }}>
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            border: "none",
            background: "transparent",
            color: "rgba(255,255,255,0.75)",
            cursor: "pointer",
            padding: 0,
            fontSize: 14,
            marginBottom: 14,
          }}
        >
          ← Back to dashboard
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Badge>Refine Idea</Badge>
          {projectStatus ? (
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
              Current status: {projectStatus}
            </span>
          ) : null}
        </div>

        <h1 style={{ fontSize: 34, margin: "6px 0 8px", lineHeight: 1.1 }}>
          Refine your idea
        </h1>

        <p style={{ margin: 0, color: "rgba(255,255,255,0.72)", maxWidth: 720 }}>
          Answer a few guided questions to clarify your idea before moving forward.
        </p>

        <div style={{ marginTop: 22, maxWidth: 760 }}>
          {loading ? (
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(0,0,0,0.25)",
                borderRadius: 16,
                padding: 16,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              Loading idea…
            </div>
          ) : (
            <>
              {error ? (
                <div
                  style={{
                    border: "1px solid rgba(255,100,100,0.35)",
                    background: "rgba(255,0,0,0.08)",
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 14,
                    color: "rgba(255,210,210,0.95)",
                  }}
                >
                  {error}
                </div>
              ) : null}

              <QuestionBlock
                label="Who is this for?"
                helper="Describe your target user as clearly as possible."
                value={targetUser}
                onChange={setTargetUser}
                placeholder="e.g. Freelancers who struggle to validate SaaS ideas"
              />

              <QuestionBlock
                label="What problem does it solve?"
                helper="What frustration or need does this address?"
                value={problem}
                onChange={setProblem}
                placeholder="e.g. They waste weeks building without knowing what users want"
              />

              <QuestionBlock
                label="What makes it different?"
                helper="Why would someone choose this over alternatives?"
                value={differentiation}
                onChange={setDifferentiation}
                placeholder="e.g. Guided workflow + honest progress + launch-ready output"
              />

              <QuestionBlock
                label="What is the simplest version?"
                helper="If you had to launch in one week, what would it include?"
                value={simplestVersion}
                onChange={setSimplestVersion}
                placeholder="e.g. Capture idea → refine → generate blueprint preview"
              />

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 14,
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={handleSave}
                  disabled={!canSave || saving}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background:
                      !canSave || saving
                        ? "rgba(255,255,255,0.08)"
                        : "linear-gradient(90deg, rgba(46, 255, 182, 0.95), rgba(255, 200, 0, 0.92), rgba(255, 68, 0, 0.90))",
                    color: !canSave || saving ? "rgba(255,255,255,0.55)" : "#07070B",
                    fontWeight: 800,
                    cursor: !canSave || saving ? "not-allowed" : "pointer",
                    minWidth: 200,
                  }}
                >
                  {saving ? "Saving…" : "Save refined idea"}
                </button>

                <button
                  onClick={handleCancel}
                  disabled={saving}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.25)",
                    color: "rgba(255,255,255,0.85)",
                    fontWeight: 700,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
