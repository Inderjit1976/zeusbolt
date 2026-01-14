import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
  }
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : null;

    if (!token) {
      return res.status(401).json({ error: "Missing auth token" });
    }

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.getUser(token);

    if (userError || !userData?.user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const userId = userData.user.id;
    const { content } = req.body || {};

    const trimmed = typeof content === "string" ? content.trim() : "";

    if (!trimmed) {
      return res.status(400).json({ error: "Content is required" });
    }

    if (trimmed.length > 2000) {
      return res
        .status(400)
        .json({ error: "Content must be under 2000 characters" });
    }

    const { data, error } = await supabaseAdmin
      .from("projects")
      .insert([{ user_id: userId, content: trimmed }])
      .select("id, content, created_at")
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ project: data });
  } catch (err) {
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
