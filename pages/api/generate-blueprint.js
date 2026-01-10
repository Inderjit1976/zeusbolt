import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, idea } = req.body || {};
  if (!title || !idea) {
    return res.status(400).json({ error: "Missing project data" });
  }

  // Helpful check: confirm key exists on server (doesn't expose it)
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is missing on the server (check Vercel env vars + redeploy).",
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
      max_tokens: 600,
    });

    const text = response?.choices?.[0]?.message?.content || "";

    let blueprint;
    try {
      blueprint = JSON.parse(text);
    } catch (parseErr) {
      console.error("AI returned non-JSON:", text);
      return res.status(500).json({
        error: "AI returned invalid JSON format.",
        detail: "Model output was not parseable JSON.",
      });
    }

    return res.status(200).json({ success: true, blueprint });
  } catch (err) {
    // This is the key: capture real OpenAI error info
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
