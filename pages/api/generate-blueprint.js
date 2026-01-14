export const config = {
  runtime: "nodejs",
};

import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { projectId, appIdea } = req.body;

    if (!projectId || !appIdea) {
      return res.status(400).json({ error: "Missing project data" });
    }

    // ZEUSBOLT BLUEPRINT PROMPT (FRIENDLY + PROFESSIONAL)
    const prompt = `
You are ZeusBolt, an expert AI app builder helping non-technical founders turn ideas into real applications.

Write a clear, structured APP BLUEPRINT using simple, friendly, professional language.
Do NOT use technical jargon.
Do NOT mention specific programming languages or frameworks.
Focus on clarity, confidence, and real-world usefulness.

Follow this EXACT structure and use clear section headings:

1. App Overview
Explain what the app is, who it is for, and the main problem it solves.

2. Target Users & Roles
List the types of users and what each one does in simple terms.

3. Core Features
Bullet point the main features users will care about.

4. Pages & Screens
List the main pages or screens the app will have.

5. Information & Data Stored
Explain what kind of information the app needs to store (in plain English).

6. Monetisation Ideas
Suggest 1–3 realistic ways this app could make money.

7. ZeusBolt Build Readiness
End with a short statement explaining that this app can be built using ZeusBolt and is suitable for a web-first launch.

App Idea:
${appIdea}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const blueprint = completion.choices[0].message.content;

    // Save blueprint to Supabase
    await supabase.from("blueprints").insert({
      project_id: projectId,
      content: blueprint,
    });

    return res.status(200).json({ blueprint });
  } catch (error) {
    console.error("Blueprint generation error:", error);
    return res.status(500).json({
      error: "Something went wrong while generating the blueprint",
    });
  }
}
