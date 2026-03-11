import { Router } from "express";
import path from "path";
import { generateAllAudio } from "../services/ttsGenerator.js";
import { validateSessionId } from "../utils/validateSessionId.js";

const router = Router();

router.post("/api/generate-audio", async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: "sessionId is required" });
      return;
    }

    if (!validateSessionId(sessionId)) {
      res.status(400).json({ error: "Invalid sessionId" });
      return;
    }

    const sessionDir = path.join(
      import.meta.dirname,
      "../../output",
      sessionId
    );

    const result = await generateAllAudio(sessionDir);

    res.json(result);
  } catch (error) {
    console.error("Audio generation failed:", error);
    res.status(500).json({
      error: "Audio generation failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
