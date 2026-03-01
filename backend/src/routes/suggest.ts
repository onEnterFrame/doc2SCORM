import { Router } from "express";
import { ai } from "../services/gemini.js";
import { buildSuggestPrompt } from "../prompts/suggestDirections.js";
import type { SuggestionsResponse } from "../types/course.js";

const router = Router();

function tryParseJSON(text: string): SuggestionsResponse | null {
  // Try direct parse
  try {
    return JSON.parse(text);
  } catch {}

  // Try extracting JSON from markdown fences or surrounding text
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }

  return null;
}

router.post("/api/suggest-directions", async (req, res) => {
  try {
    const { extractedText } = req.body;
    if (!extractedText) {
      res.status(400).json({ error: "extractedText is required" });
      return;
    }

    const prompt = buildSuggestPrompt(extractedText);

    let parsed: SuggestionsResponse | null = null;

    // First attempt
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = response.text ?? "";
    parsed = tryParseJSON(text);

    // Retry once if malformed
    if (!parsed) {
      console.warn("First suggestion attempt failed to parse, retrying...");
      const retry = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: prompt }] },
          { role: "model", parts: [{ text }] },
          {
            role: "user",
            parts: [
              {
                text: "Your previous response was not valid JSON. Respond ONLY with the JSON object, no markdown fences or extra text.",
              },
            ],
          },
        ],
      });
      parsed = tryParseJSON(retry.text ?? "");
    }

    if (!parsed || !Array.isArray(parsed.suggestions)) {
      res.status(500).json({ error: "Failed to generate valid suggestions" });
      return;
    }

    res.json(parsed);
  } catch (error) {
    console.error("Suggestion generation failed:", error);
    res.status(500).json({
      error: "Suggestion generation failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
