import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, idea } = req.body;

  if (!title || !idea) {
    return res.status(400).json({ error: "Missing project data" });
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
      max_tokens: 500,
    });

    const text = response.choices[0].message.content;

    // Parse AI JSON safely
    let blueprint;
    try {
      blueprint = JSON.parse(text);
    } catch {
      return res.status(500).json({
        error: "AI returned invalid format",
      });
    }

    return res.status(200).json({
      success: true,
      blueprint,
    });
  } catch (error) {
    return res.status(500).json({
      error: "AI generation failed",
    });
  }
}
