import express from "express";
import cors from "cors";
import path from "path";
import { mkdir, readdir, stat, rm } from "fs/promises";
import { existsSync } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: path.join(import.meta.dirname, "../../.env") });

import uploadRouter from "./routes/upload.js";
import suggestRouter from "./routes/suggest.js";
import generateRouter from "./routes/generate.js";
import audioRouter from "./routes/audio.js";
import scormRouter from "./routes/scorm.js";
import publishRouter from "./routes/publish.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3456", 10);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Serve generated assets for preview
app.use(
  "/api/assets",
  express.static(path.join(import.meta.dirname, "../output"))
);

// Routes
app.use(uploadRouter);
app.use(suggestRouter);
app.use(generateRouter);
app.use(audioRouter);
app.use(scormRouter);
app.use(publishRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Serve frontend static files in production (Docker)
const frontendDist = path.join(import.meta.dirname, "../../frontend/dist");
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// Purge session directories older than 1 hour
const OUTPUT_DIR = path.join(import.meta.dirname, "../output");
const SESSION_MAX_AGE_MS = 60 * 60 * 1000;

async function purgeOldSessions() {
  try {
    const entries = await readdir(OUTPUT_DIR);
    const now = Date.now();
    for (const entry of entries) {
      const entryPath = path.join(OUTPUT_DIR, entry);
      const info = await stat(entryPath).catch(() => null);
      if (info?.isDirectory() && now - info.mtimeMs > SESSION_MAX_AGE_MS) {
        await rm(entryPath, { recursive: true, force: true });
        console.log(`Purged old session: ${entry}`);
      }
    }
  } catch {
    // Non-critical — log nothing
  }
}

// Ensure directories exist
async function init() {
  await mkdir(path.join(import.meta.dirname, "../uploads"), {
    recursive: true,
  });
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Run cleanup every 15 minutes
  setInterval(purgeOldSessions, 15 * 60 * 1000);
  purgeOldSessions();

  app.listen(PORT, () => {
    console.log(`Doc2SCORM backend running on http://localhost:${PORT}`);
  });
}

init();
