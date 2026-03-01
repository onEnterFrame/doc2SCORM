import archiver from "archiver";
import { readFile, readdir } from "fs/promises";
import path from "path";
import type { Course } from "../types/course.js";

export async function buildScormPackage(
  sessionDir: string,
  course: Course
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const chunks: Buffer[] = [];
    const archive = archiver("zip", { zlib: { level: 5 } });

    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    const templatesDir = path.join(import.meta.dirname, "../templates");

    // 1. imsmanifest.xml
    const manifestTemplate = await readFile(
      path.join(templatesDir, "imsmanifest.xml"),
      "utf-8"
    );
    const courseId = `doc2scorm_${Date.now()}`;
    const assetsDir = path.join(sessionDir, "assets");

    let assetFiles: string[] = [];
    try {
      assetFiles = await readdir(assetsDir);
    } catch {}

    const fileEntries = assetFiles
      .map((f) => `      <file href="assets/${f}" />`)
      .join("\n");

    const manifest = manifestTemplate
      .replace(/\{\{COURSE_ID\}\}/g, courseId)
      .replace(/\{\{COURSE_TITLE\}\}/g, escapeXml(course.title))
      .replace("{{FILE_ENTRIES}}", fileEntries);

    archive.append(manifest, { name: "imsmanifest.xml" });

    // 2. index.html
    const indexHtml = await readFile(
      path.join(templatesDir, "index.html"),
      "utf-8"
    );
    archive.append(indexHtml, { name: "index.html" });

    // 3. runtime.js
    const runtimeJs = await readFile(
      path.join(templatesDir, "runtime.js"),
      "utf-8"
    );
    archive.append(runtimeJs, { name: "js/runtime.js" });

    // 4. course.json
    archive.append(JSON.stringify(course, null, 2), { name: "course.json" });

    // 5. All assets
    for (const file of assetFiles) {
      const filePath = path.join(assetsDir, file);
      archive.file(filePath, { name: `assets/${file}` });
    }

    archive.finalize();
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
