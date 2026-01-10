export const config = {
  runtime: "nodejs",
};

import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client (bypasses RLS safely)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// FREE TIER DAILY LIMIT
const DAILY_LIMIT = 3;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, idea, project_id, user_id } = req.body || {};

  if (!title || !idea || !project_id || !user_id) {
    return res.status(400).json({ error: "Missing required data" });
  }

  try {
    // --------------------------------------------------
    // LIMIT 1: One blueprint per project
    // --------------------------------------------------
    const { data: existingBlueprint } = await supabase
      .from("blueprints")
      .select("id")
      .eq("project_id", project_id)
      .maybeSingle();

    if (existingBlueprint) {
      return res.status(403).json({
        error: "Blueprint already exists for this project.",
      });
    }

    // --------------------------------------------------
    // LIMIT 2: Daily per-user limit
    // --------------------------------------------------
    const today = new Date().toISOString().split("T")[0];

    const { data: usageRow } = await supabase
      .from("ai_usage")
      .select("id, count")
      .eq("user_id", user_id)
      .eq("usage_date", today)
      .maybeSingle();

    if (usageRow && usageRow.count >= DAILY_LIMIT) {
      return res.status(429).json({
        error:
          "Daily AI limit reached (3/day). Please try again tomorrow or upgrade.",
      });
    }

    // --------------------------------------------------
    // AI GENERATION
    // --------------------------------------------------
    const prompt = `
You are an expert SaaS product architect.

Based on the following app idea, generate a structured JSON blueprint.

App Title:
${title}

App Idea:
${idea}

Return ONLY valid JSON in this exact structure:

{
  "overview": "short overview",
  "pages": ["page 1", "page 2"],
  "dataModels": ["model 1", "model 2"],
  "nextSteps": "short next steps"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 700,
    });

    const blueprint = JSON.parse(
      response.choices[0].message.content
    );

    // --------------------------------------------------
    // UPDATE USAGE COUNT (after successful AI call)
    // --------------------------------------------------
    if (usageRow) {
      await supabase
        .from("ai_usage")
        .update({ count: usageRow.count + 1 })
        .eq("id", usageRow.id);
    } else {
      await supabase.from("ai_usage").insert([
        {
          user_id,
          usage_date: today,
          count: 1,
        },
      ]);
    }

    return res.status(200).json({
      success: true,
      blueprint,
    });
  } catch (err) {
    console.error("AI generation error:", err);
    return res.status(500).json({
      error: "AI generation failed",
    });
  }
}
