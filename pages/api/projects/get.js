import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Missing project id" });
  }

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : null;

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: "Invalid user" });
    }

    const { data, error } = await supabase
      .from("projects")
      .select("id, content, created_at, updated_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: "Project not found" });
    }

    return res.status(200).json({ project: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
