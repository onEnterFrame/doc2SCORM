import { Router } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { mkdir, writeFile, unlink } from "fs/promises";
import { extractText } from "../services/extractText.js";

const router = Router();

const extToMime: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".md": "text/markdown",
  ".txt": "text/plain",
};

const allowedMimes = new Set(Object.values(extToMime));

const upload = multer({
  dest: path.join(import.meta.dirname, "../../uploads"),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // Some browsers/proxies send application/octet-stream — resolve from extension
    if (
      file.mimetype === "application/octet-stream" ||
      !allowedMimes.has(file.mimetype)
    ) {
      const ext = path.extname(file.originalname).toLowerCase();
      const resolved = extToMime[ext];
      if (resolved) {
        file.mimetype = resolved;
        cb(null, true);
        return;
      }
    }
    if (allowedMimes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

router.post("/api/upload", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const sessionId = uuidv4();
    const sessionDir = path.join(
      import.meta.dirname,
      "../../output",
      sessionId
    );
    const assetsDir = path.join(sessionDir, "assets");
    await mkdir(assetsDir, { recursive: true });

    const text = await extractText(req.file.path, req.file.mimetype);
    // Remove multer temp file — text is extracted, no longer needed
    unlink(req.file.path).catch(() => {});
    await writeFile(path.join(sessionDir, "extracted.txt"), text, "utf-8");

    const wordCount = text.split(/\s+/).filter(Boolean).length;

    res.json({
      sessionId,
      extractedText: text,
      wordCount,
      fileName: req.file.originalname,
    });
  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({
      error: "Upload failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
