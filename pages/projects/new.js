"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function NewProjectPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [idea, setIdea] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Protect page: must be logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/auth");
      } else {
        setLoading(false);
      }
    });
  }, [router]);

  async function handleCreateProject(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim() || !idea.trim()) {
      setErrorMsg("Please enter both a project title and an app idea.");
      return;
    }

    setSaving(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { error } = await supabase.from("projects").insert([
      {
        user_id: session.user.id,
        title: title.trim(),
        idea: idea.trim(),
        status: "draft",
      },
    ]);

    setSaving(false);

    if (error) {
      setErrorMsg(error.message || "Failed to create project.");
      return;
    }

    // Success → go back to dashboard
    router.push("/dashboard");
  }

  if (loading) {
    return <p style={{ padding: 40 }}>Loading…</p>;
  }

  return (
    <div style={{ padding: 40, maxWidth: 700, margin: "0 auto" }}>
      <h1>Create a New Project</h1>
      <p style={{ color: "#555", marginBottom: 20 }}>
        Describe your app idea in simple language. ZeusBolt will use this later
        to generate your app.
      </p>

      {errorMsg && (
        <p style={{ color: "red", marginBottom: 12 }}>{errorMsg}</p>
      )}

      <form onSubmit={handleCreateProject}>
        <div style={{ marginBottom: 16 }}>
          <label>
            <strong>Project Title</strong>
          </label>
          <br />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Local Gym Booking App"
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>
            <strong>App Idea</strong>
          </label>
          <br />
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe what the app should do..."
            rows={8}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "10px 16px",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          {saving ? "Creating…" : "Create Project"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          style={{
            padding: "10px 16px",
            fontSize: 16,
            marginLeft: 10,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
