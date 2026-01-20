import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
  }
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.getUser(token);

    if (userError || !userData?.user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Missing project id" });
    }

    const { data, error } = await supabaseAdmin
      .from("projects")
      .select(
        `
        content,
        refinement_step_1,
        refinement_step_2,
        refinement_step_3,
        refinement_step_4,
        refinement_step_5,
        refinement_step_6
        `
      )
      .eq("id", id)
      .eq("user_id", userData.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Project not found" });
    }

    return res.status(200).json({
      content: data.content,
      refinement: {
        step_1: data.refinement_step_1 || "",
        step_2: data.refinement_step_2 || "",
        step_3: data.refinement_step_3 || "",
        step_4: data.refinement_step_4 || "",
        step_5: data.refinement_step_5 || "",
        step_6: data.refinement_step_6 || "",
      },
    });
  } catch (err) {
    console.error("Refinement API error:", err);
    return res.status(500).json({ error: "Unexpected error" });
  }
}
