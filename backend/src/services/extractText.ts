import { readFile } from "fs/promises";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { marked } from "marked";

export async function extractText(
  filePath: string,
  mimeType: string
): Promise<string> {
  const buffer = await readFile(filePath);

  switch (mimeType) {
    case "application/pdf": {
      const data = await pdfParse(buffer);
      return data.text;
    }
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case "text/markdown": {
      const md = buffer.toString("utf-8");
      const html = await marked.parse(md);
      return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    }
    case "text/plain":
    default:
      return buffer.toString("utf-8");
  }
}
