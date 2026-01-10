export const config = {
  runtime: "nodejs",
};

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, idea } = req.body || {};

  if (!title || !idea) {
    return res.status(400).json({ error: "Missing project data" });
  }

  // Confirm the key exists (does not expose it)
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error:
        "OPENAI_API_KEY is missing on the server. Check Vercel env vars and redeploy.",
    });
  }

  try {
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

    const text = response?.choices?.[0]?.message?.content || "";

    // Parse JSON safely
    let blueprint;
    try {
      blueprint = JSON.parse(text);
    } catch (parseErr) {
      console.error("AI returned non-JSON:", text);
      return res.status(500).json({
        error: "AI returned invalid JSON format.",
      });
    }

    return res.status(200).json({
      success: true,
      blueprint,
    });
  } catch (err) {
    // Log the real OpenAI error to Vercel logs (safe)
    const status = err?.status || err?.response?.status || 500;
    const message =
      err?.message ||
      err?.response?.data?.error?.message ||
      "Unknown error";

    console.error("OpenAI error:", { status, message });

    return res.status(status).json({
      error: "AI generation failed.",
      status,
      detail: message,
    });
  }
}
