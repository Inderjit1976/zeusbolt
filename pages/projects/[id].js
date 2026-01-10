"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ProjectDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (!id) return;

    async function loadProject() {
      // Check login
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        router.replace("/auth");
        return;
      }

      // Load project (RLS ensures only owner can access)
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, idea, status, created_at")
        .eq("id", id)
        .single();

      if (error || !data) {
        router.replace("/dashboard");
        return;
      }

      setProject(data);
      setLoading(false);
    }

    loadProject();
  }, [id, router]);

  if (loading) {
    return <p style={{ padding: 40 }}>Loading project…</p>;
  }

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: "0 auto" }}>
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
      <p style={{ whiteSpace: "pre-wrap" }}>{project.idea}</p>

      <p style={{ marginTop: 24, fontSize: 14, color: "#888" }}>
        Created on{" "}
        {new Date(project.created_at).toLocaleDateString()}{" "}
        {new Date(project.created_at).toLocaleTimeString()}
      </p>
    </div>
  );
}
