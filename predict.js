// Fonction serverless (compatible Vercel).
// Reçoit { prompt, useWebSearch } et appelle l'API Anthropic avec la clé secrète
// stockée dans la variable d'environnement ANTHROPIC_API_KEY (jamais exposée au client).

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { prompt, useWebSearch } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: "Le champ 'prompt' est requis" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Clé API non configurée sur le serveur" });
  }

  const body = {
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  };

  if (useWebSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: "Erreur API Anthropic", details: errText });
    }

    const data = await response.json();
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur", details: String(e) });
  }
}
