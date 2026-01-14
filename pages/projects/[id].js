"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

// Supabase client (frontend-safe)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ProjectDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [blueprint, setBlueprint] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load project + blueprint
  useEffect(() => {
    if (!id) return;

    async function loadData() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/auth");
        return;
      }

      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("id, title, idea, status")
        .eq("id", id)
        .single();

      if (projectError || !projectData) {
        router.replace("/dashboard");
        return;
      }

      setProject(projectData);

      // Fetch blueprint (if exists)
      const { data: blueprintData } = await supabase
        .from("blueprints")
        .select("content, created_at")
        .eq("project_id", id)
        .single();

      if (blueprintData) {
        setBlueprint(blueprintData);
      }

      setLoading(false);
    }

    loadData();
  }, [id, router]);

  async function handleGenerateBlueprint() {
    setErrorMsg("");
    setGenerating(true);

    // Always fetch fresh session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setErrorMsg("You are not logged in. Please log in again.");
      setGenerating(false);
      return;
    }

    try {
      const response = await fetch("/api/generate-blueprint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: project.title,
          idea: project.idea,
          project_id: project.id,
          user_id: session.user.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Generation failed");
      }

      // Save blueprint to Supabase
      const { error } = await supabase.from("blueprints").insert([
        {
          user_id: session.user.id,
          project_id: project.id,
          content: result.blueprint,
        },
      ]);

      if (error) {
        throw error;
      }

      setBlueprint({
        content: result.blueprint,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      setErrorMsg(
        err.message || "Something went wrong while generating the blueprint."
      );
    }

    setGenerating(false);
  }

  if (loading) {
    return <p style={{ padding: 40 }}>Loading project…</p>;
  }

  return (
    <div style={{ padding: 40, maxWidth: 900, margin: "0 auto" }}>
      <button
        onClick={() => router.push("/dashboard")}
        style={{ marginBottom: 20, cursor: "pointer" }}
      >
        ← Back to Dashboard
      </button>

      <h1>{project.title}</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>
        Status: <strong>{project.status}</strong>
      </p>

      <h3>App Idea</h3>
      <p style={{ whiteSpace: "pre-wrap", marginBottom: 24 }}>
        {project.idea}
      </p>

      {errorMsg && (
        <p style={{ color: "red", marginBottom: 12 }}>{errorMsg}</p>
      )}

      {!blueprint ? (
        <button
          onClick={handleGenerateBlueprint}
          disabled={generating}
          style={{
            padding: "10px 16px",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          {generating ? "Generating…" : "Generate Blueprint"}
        </button>
      ) : (
        <div style={{ marginTop: 40 }}>
          <h2>Blueprint</h2>

          <p>
            <strong>Overview:</strong> {blueprint.content.overview}
          </p>

          <h4>Pages</h4>
          <ul>
            {blueprint.content.pages.map((page, index) => (
              <li key={index}>{page}</li>
            ))}
          </ul>

          <h4>Data Models</h4>
          <ul>
            {blueprint.content.dataModels.map((model, index) => (
              <li key={index}>{model}</li>
            ))}
          </ul>

          <p style={{ marginTop: 12 }}>
            <strong>Next steps:</strong> {blueprint.content.nextSteps}
          </p>

          <p style={{ fontSize: 12, color: "#888", marginTop: 16 }}>
            Generated on{" "}
            {new Date(blueprint.created_at).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
