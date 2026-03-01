import express from "express";
import cors from "cors";
import path from "path";
import { mkdir } from "fs/promises";
import dotenv from "dotenv";

dotenv.config({ path: path.join(import.meta.dirname, "../../.env") });

import uploadRouter from "./routes/upload.js";
import suggestRouter from "./routes/suggest.js";
import generateRouter from "./routes/generate.js";
import audioRouter from "./routes/audio.js";
import scormRouter from "./routes/scorm.js";

const app = express();
const PORT = 3456;

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

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Ensure directories exist
async function init() {
  await mkdir(path.join(import.meta.dirname, "../uploads"), {
    recursive: true,
  });
  await mkdir(path.join(import.meta.dirname, "../output"), {
    recursive: true,
  });

  app.listen(PORT, () => {
    console.log(`Doc2SCORM backend running on http://localhost:${PORT}`);
  });
}

init();
