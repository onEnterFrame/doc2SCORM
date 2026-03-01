import path from "path";
import { readFile, writeFile } from "fs/promises";
import { ai } from "./gemini.js";
import { encodeWav } from "../utils/wavEncoder.js";
import type { Course } from "../types/course.js";

async function generateScreenAudio(
  narration: string,
  outputPath: string
): Promise<boolean> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ role: "user", parts: [{ text: narration }] }],
      config: {
        responseModalities: ["AUDIO" as any],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const audioData =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
      console.warn("No audio data returned from TTS");
      return false;
    }

    const pcmBuffer = Buffer.from(audioData, "base64");
    const wavBuffer = encodeWav(pcmBuffer, 24000, 16, 1);
    await writeFile(outputPath, wavBuffer);
    return true;
  } catch (err) {
    console.error(
      `TTS failed: ${err instanceof Error ? err.message : "Unknown error"}`
    );
    return false;
  }
}

export async function generateAllAudio(
  sessionDir: string
): Promise<{ audioCount: number; failedCount: number }> {
  const courseJson = await readFile(
    path.join(sessionDir, "course.json"),
    "utf-8"
  );
  const course: Course = JSON.parse(courseJson);

  const assetsDir = path.join(sessionDir, "assets");
  let audioCount = 0;
  let failedCount = 0;

  for (const module of course.modules) {
    for (const screen of module.screens) {
      if (!screen.narration) continue;

      const audioFile = `${screen.id}.wav`;
      const audioPath = path.join(assetsDir, audioFile);

      const success = await generateScreenAudio(screen.narration, audioPath);

      if (success) {
        screen.audio = { file: audioFile };
        audioCount++;
      } else {
        screen.audio = null;
        failedCount++;
      }
    }
  }

  // Update course.json with audio references
  await writeFile(
    path.join(sessionDir, "course.json"),
    JSON.stringify(course, null, 2),
    "utf-8"
  );

  return { audioCount, failedCount };
}
