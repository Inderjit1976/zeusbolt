console.log("🔥 BLUEPRINT PAGE LOADED");

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function BlueprintPage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState(null);

  const [projectContent, setProjectContent] = useState(null);
  const [refinement, setRefinement] = useState(null);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      setAuthChecked(true);

      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const refinementRes = await fetch(
          `/api/projects/refinement?id=${id}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (!refinementRes.ok) {
          throw new Error("Project not found or access denied");
        }

        const refinementData = await refinementRes.json();

        setRefinement(refinementData.refinement);
        setProjectContent(refinementData.content);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, router]);

  if (!authChecked || loading) {
    return (
      <div style={{ padding: "3rem" }}>
        <h2>Loading blueprint…</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "3rem", color: "#ff6b6b" }}>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  const steps = [
    refinement?.step_1,
    refinement?.step_2,
    refinement?.step_3,
    refinement?.step_4,
    refinement?.step_5,
    refinement?.step_6,
  ];

  const isComplete = steps.every(
    (step) => step && step.trim().length > 0
  );

  if (!isComplete) {
    return (
      <div style={{ padding: "3rem" }}>
        <h1>Blueprint not ready</h1>
        <p>This project has not completed all 6 refinement steps yet.</p>
      </div>
    );
  }

  const cardStyle = {
    background: "rgba(255,255,255,0.05)",
    borderRadius: "12px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
  };

  const sidebarCard = {
    ...cardStyle,
    position: "sticky",
    top: "2rem",
  };

  return (
    <div>
      {/* PAGE CONTEXT STRIP */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "1.5rem 3rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
              Project · Blueprint
            </div>
            <h1 style={{ margin: 0, fontSize: "1.6rem" }}>
              {projectContent}
            </h1>
          </div>

          <div
            style={{
              background: "rgba(124,255,124,0.15)",
              color: "#7CFF7C",
              padding: "0.45rem 0.9rem",
              borderRadius: "999px",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            ✓ Blueprint complete
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div
        style={{
          padding: "3rem",
          maxWidth: "1400px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "2.5fr 1fr",
          gap: "2.5rem",
        }}
      >
        {/* LEFT COLUMN */}
        <div>
          <div style={cardStyle}>
            <h2>Original Idea</h2>
            <p>{projectContent}</p>
          </div>

          <div style={cardStyle}>
            <h2>Refinement Summary</h2>
            <ol>
              <li><strong>Who is this for?</strong><p>{refinement.step_1}</p></li>
              <li><strong>What problem does this solve?</strong><p>{refinement.step_2}</p></li>
              <li><strong>Why is this better?</strong><p>{refinement.step_3}</p></li>
              <li><strong>Core value proposition</strong><p>{refinement.step_4}</p></li>
              <li><strong>Risks & assumptions</strong><p>{refinement.step_5}</p></li>
              <li><strong>Simplest version to test</strong><p>{refinement.step_6}</p></li>
            </ol>
          </div>

          <div style={cardStyle}>
            <h2>Generated Blueprint</h2>
            <h3>Product Summary</h3>
            <p>
              A product for <strong>{refinement.step_1}</strong>, focused on
              solving <strong>{refinement.step_2}</strong>.
            </p>
            <h3>Differentiation</h3>
            <p>{refinement.step_3}</p>
            <h3>Value Proposition</h3>
            <p>{refinement.step_4}</p>
            <h3>MVP Scope</h3>
            <p>{refinement.step_6}</p>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div>
          <div style={sidebarCard}>
            <h3>Status</h3>
            <p style={{ color: "#7CFF7C" }}>✓ Blueprint complete</p>
            <hr style={{ opacity: 0.2 }} />
            <h3>Project Snapshot</h3>
            <p><strong>Target user:</strong><br />{refinement.step_1}</p>
            <p><strong>Main problem:</strong><br />{refinement.step_2}</p>
            <hr style={{ opacity: 0.2 }} />
            <h3>Next Steps</h3>
            <ul>
              <li>Generate build plan</li>
              <li>Define MVP features</li>
              <li>Prepare validation test</li>
            </ul>
            <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>
              (Coming next)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
