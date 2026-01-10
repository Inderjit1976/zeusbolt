export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, idea } = req.body;

  if (!title || !idea) {
    return res.status(400).json({ error: "Missing project data" });
  }

  // TEST MODE: fake AI response
  const fakeBlueprint = {
    overview: `This is a test blueprint for "${title}".`,
    pages: [
      "Landing page",
      "Authentication",
      "User dashboard",
      "Settings",
    ],
    dataModels: ["Users", "Projects", "Blueprints"],
    nextSteps:
      "This blueprint was generated in test mode. Real AI will be added next.",
  };

  // Simulate delay (feels like AI)
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return res.status(200).json({
    success: true,
    blueprint: fakeBlueprint,
  });
}
