import { Router } from "express";
import path from "path";
import { readFile } from "fs/promises";
import { generateCourse } from "../services/courseGenerator.js";

const router = Router();

router.get("/api/course/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessionDir = path.join(
      import.meta.dirname,
      "../../output",
      sessionId
    );
    const courseJson = await readFile(
      path.join(sessionDir, "course.json"),
      "utf-8"
    );
    res.json({ course: JSON.parse(courseJson) });
  } catch (error) {
    res.status(404).json({ error: "Course not found" });
  }
});

router.post("/api/generate-course", async (req, res) => {
  try {
    const { sessionId, extractedText, direction } = req.body;

    if (!sessionId || !extractedText || !direction) {
      res
        .status(400)
        .json({ error: "sessionId, extractedText, and direction are required" });
      return;
    }

    const sessionDir = path.join(
      import.meta.dirname,
      "../../output",
      sessionId
    );

    const course = await generateCourse(sessionDir, extractedText, direction);

    res.json({ course });
  } catch (error) {
    console.error("Course generation failed:", error);
    res.status(500).json({
      error: "Course generation failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
