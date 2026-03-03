import { Router } from "express";
import path from "path";
import { readFile } from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { publishCourse, getGallery } from "../services/gcsPublisher.js";
import type { Course } from "../types/course.js";

const router = Router();

router.post("/api/publish", async (req, res) => {
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

    const publishId = uuidv4().replace(/-/g, "").substring(0, 12);

    const entry = await publishCourse(sessionDir, course, publishId);

    res.json({
      publishId: entry.id,
      url: entry.url,
      thumbnail: entry.thumbnail,
    });
  } catch (error) {
    console.error("Publish failed:", error);
    res.status(500).json({
      error: "Publish failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/api/gallery", async (_req, res) => {
  try {
    const courses = await getGallery();
    res.json({ courses });
  } catch (error) {
    console.error("Gallery fetch failed:", error);
    res.status(500).json({
      error: "Gallery fetch failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
