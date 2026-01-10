"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);

  // Check login and load projects
  useEffect(() => {
    async function loadDashboard() {
      const { data: sessionData } = await supabase.auth.getSession();

      // If not logged in, go to /auth
      if (!sessionData.session) {
        router.replace("/auth");
        return;
      }

      // Load projects for this user
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, idea, status, created_at")
        .order("created_at", { ascending: false });

      if (!error) {
        setProjects(data || []);
      }

      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  // Logout handler
  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  if (loading) {
    return <p style={{ padding: 40 }}>Loading dashboard…</p>;
  }

  return (
    <div style={{ padding: 40, maxWidth: 900, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1>ZeusBolt Dashboard ⚡</h1>

        <button
          onClick={handleLogout}
          style={{
            padding: "8px 14px",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Log out
        </button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => router.push("/projects/new")}
          style={{
            padding: "10px 16px",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          + Create New Project
        </button>
      </div>

      <h2>Your Projects</h2>

      {projects.length === 0 ? (
        <p>You haven’t created any projects yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {projects.map((project) => (
           <div
  key={project.id}
  onClick={() => router.push(`/projects/${project.id}`)}
  style={{
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 16,
    cursor: "pointer",
  }}
>

              <h3 style={{ marginTop: 0 }}>{project.title}</h3>
              <p style={{ color: "#555" }}>{project.idea}</p>
              <small>
                Status: {project.status} • Created{" "}
                {new Date(project.created_at).toLocaleString()}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
