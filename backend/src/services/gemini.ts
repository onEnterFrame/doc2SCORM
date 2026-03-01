import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
import path from "path";

// Load .env before checking for the key (ESM imports are hoisted above dotenv.config in index.ts)
dotenv.config({ path: path.join(import.meta.dirname, "../../../.env") });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is required in .env");
}

const ai = new GoogleGenAI({ apiKey });

export { ai, Modality };
