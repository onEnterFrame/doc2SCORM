import { Storage } from "@google-cloud/storage";
import { readFile, readdir } from "fs/promises";
import path from "path";
import type { Course, GalleryEntry } from "../types/course.js";

const BUCKET_NAME = process.env.GCS_GALLERY_BUCKET || "doc2scorm-gallery";
const storage = new Storage();
const bucket = storage.bucket(BUCKET_NAME);

const templatesDir = path.join(import.meta.dirname, "../templates");

export async function publishCourse(
  sessionDir: string,
  course: Course,
  publishId: string
): Promise<GalleryEntry> {
  const prefix = `courses/${publishId}`;

  // Upload index.html from templates
  const indexHtml = await readFile(
    path.join(templatesDir, "index.html"),
    "utf-8"
  );
  await uploadString(`${prefix}/index.html`, indexHtml, "text/html");

  // Upload runtime.js from templates
  const runtimeJs = await readFile(
    path.join(templatesDir, "runtime.js"),
    "utf-8"
  );
  await uploadString(
    `${prefix}/js/runtime.js`,
    runtimeJs,
    "application/javascript"
  );

  // Upload course.json
  await uploadString(
    `${prefix}/course.json`,
    JSON.stringify(course, null, 2),
    "application/json"
  );

  // Upload all assets
  const assetsDir = path.join(sessionDir, "assets");
  let assetFiles: string[] = [];
  try {
    assetFiles = await readdir(assetsDir);
  } catch {
    // no assets directory
  }

  for (const file of assetFiles) {
    const filePath = path.join(assetsDir, file);
    const contentType = file.endsWith(".wav")
      ? "audio/wav"
      : file.endsWith(".png")
        ? "image/png"
        : "application/octet-stream";
    await bucket.upload(filePath, {
      destination: `${prefix}/assets/${file}`,
      metadata: {
        contentType,
        cacheControl: "public, max-age=31536000",
      },
    });
  }

  // Find thumbnail: first scene image
  let thumbnail: string | null = null;
  for (const mod of course.modules) {
    for (const screen of mod.screens) {
      if (screen.image?.file) {
        thumbnail = `https://storage.googleapis.com/${BUCKET_NAME}/${prefix}/assets/${screen.image.file}`;
        break;
      }
    }
    if (thumbnail) break;
  }

  const screenCount = course.modules.reduce(
    (sum, m) => sum + m.screens.length,
    0
  );

  const entry: GalleryEntry = {
    id: publishId,
    title: course.title,
    description: course.modules[0]?.narrativeTheme || "",
    theme: course.theme,
    thumbnail,
    moduleCount: course.modules.length,
    screenCount,
    publishedAt: new Date().toISOString(),
    url: `https://storage.googleapis.com/${BUCKET_NAME}/${prefix}/index.html`,
  };

  await addToGallery(entry);

  return entry;
}

async function uploadString(
  destination: string,
  content: string,
  contentType: string
): Promise<void> {
  const file = bucket.file(destination);
  await file.save(content, {
    contentType,
    metadata: {
      cacheControl:
        contentType === "application/json"
          ? "public, max-age=60"
          : "public, max-age=31536000",
    },
  });
}

async function addToGallery(entry: GalleryEntry): Promise<void> {
  const galleryFile = bucket.file("gallery.json");

  let entries: GalleryEntry[] = [];
  try {
    const [contents] = await galleryFile.download();
    entries = JSON.parse(contents.toString());
  } catch {
    // gallery.json doesn't exist yet
  }

  // Prepend new entry (newest first)
  entries.unshift(entry);

  await galleryFile.save(JSON.stringify(entries, null, 2), {
    contentType: "application/json",
    metadata: { cacheControl: "public, max-age=60" },
  });
}

export async function getGallery(): Promise<GalleryEntry[]> {
  const galleryFile = bucket.file("gallery.json");

  try {
    const [contents] = await galleryFile.download();
    return JSON.parse(contents.toString());
  } catch {
    return [];
  }
}
