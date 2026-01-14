import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase admin environment variables");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Get user from Supabase auth cookie/session (no manual Bearer header required)
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(
      req.headers.authorization?.replace("Bearer ", "") || undefined
    );

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("id, content, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ projects: data || [] });
  } catch (err) {
    console.error("projects/list error:", err);
    return res.status(500).json({ error: "Server configuration error" });
  }
}
