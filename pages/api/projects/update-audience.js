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
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.getUser(token);

    if (userError || !userData?.user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const { id, step, value } = req.body;

    if (!id || !step) {
      return res.status(400).json({ error: "Missing project id or step" });
    }

    let updatePayload = {};

    if (step === 1) updatePayload.refinement_step_1 = value;
    else if (step === 2) updatePayload.refinement_step_2 = value;
    else if (step === 3) updatePayload.refinement_step_3 = value;
    else if (step === 4) updatePayload.refinement_step_4 = value;
    else if (step === 5) updatePayload.refinement_step_5 = value;
    else if (step === 6) updatePayload.refinement_step_6 = value;
    else {
      return res.status(400).json({ error: "Invalid step" });
    }

    const { error } = await supabaseAdmin
      .from("projects")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", userData.user.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Unexpected error" });
  }
}
