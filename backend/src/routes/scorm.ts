import { Router } from "express";
import path from "path";
import { readFile, writeFile } from "fs/promises";
import { buildScormPackage } from "../services/scormPackager.js";
import type { Course } from "../types/course.js";

const router = Router();

router.post("/api/build-scorm", async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: "sessionId is required" });
      return;
    }

    const sessionDir = path.join(
      import.meta.dirname,
      "../../output",
      sessionId
    );

    const courseJson = await readFile(
      path.join(sessionDir, "course.json"),
      "utf-8"
    );
    const course: Course = JSON.parse(courseJson);

    const zipBuffer = await buildScormPackage(sessionDir, course);
    await writeFile(path.join(sessionDir, "course.zip"), zipBuffer);

    res.json({
      downloadUrl: `/api/download/${sessionId}/course.zip`,
      sizeBytes: zipBuffer.length,
    });
  } catch (error) {
    console.error("SCORM build failed:", error);
    res.status(500).json({
      error: "SCORM build failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/api/download/:sessionId/course.zip", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const zipPath = path.join(
      import.meta.dirname,
      "../../output",
      sessionId,
      "course.zip"
    );

    const zipBuffer = await readFile(zipPath);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="course-${sessionId.substring(0, 8)}.zip"`
    );
    res.send(zipBuffer);
  } catch (error) {
    res.status(404).json({ error: "SCORM package not found" });
  }
});

export default router;
