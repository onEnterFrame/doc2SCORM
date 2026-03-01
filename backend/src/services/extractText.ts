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
      const tokens = marked.lexer(md);
      return tokens
        .map((t) => ("text" in t ? (t as { text: string }).text : ""))
        .filter(Boolean)
        .join("\n");
    }
    case "text/plain":
    default:
      return buffer.toString("utf-8");
  }
}
