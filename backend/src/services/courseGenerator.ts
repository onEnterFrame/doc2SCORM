import path from "path";
import { writeFile, readFile } from "fs/promises";
import { ai, Modality } from "./gemini.js";
import { buildCoursePrompt } from "../prompts/generateCourse.js";
import type {
  Course,
  CourseTheme,
  Module,
  Screen,
  QuizQuestion,
  StorySuggestion,
} from "../types/course.js";

interface ParsedDecisionOption {
  label: string;
  feedback: string;
  isRecommended: boolean;
}

interface ParsedScene {
  moduleNum: number;
  screenNum: number;
  title: string;
  storyText: string;
  narration: string;
  onScreenText: string;
  visualDirection: string;
  interactionType: string;
  interactionPrompt: string;
  decisionOptions: ParsedDecisionOption[];
}

interface ParsedQuiz {
  moduleNum: number;
  questions: QuizQuestion[];
}

function parseTheme(text: string): CourseTheme | undefined {
  const themeMatch = text.match(
    /\[THEME\]\s*\n([\s\S]*?)(?=\[SCENE|\[QUIZ|$)/i,
  );
  if (!themeMatch) return undefined;

  const block = themeMatch[1];
  const get = (field: string): string => {
    const m = block.match(new RegExp(`${field}:\\s*(.+)`, "i"));
    return m ? m[1].trim() : "";
  };

  const gradientStart = get("GRADIENT_START");
  const gradientEnd = get("GRADIENT_END");
  const accent = get("ACCENT");
  const textOnGlass = get("TEXT_ON_GLASS");
  const textOnGlassSecondary = get("TEXT_ON_GLASS_SECONDARY");

  if (!gradientStart || !accent) return undefined;

  return {
    gradientStart,
    gradientEnd: gradientEnd || gradientStart,
    accent,
    textOnGlass: textOnGlass || accent,
    textOnGlassSecondary: textOnGlassSecondary || `rgba(0,0,0,0.7)`,
  };
}

function parseScenes(text: string): ParsedScene[] {
  const scenes: ParsedScene[] = [];
  const sceneRegex =
    /\[SCENE\s+(\d+)\.(\d+)\]\s*\n([\s\S]*?)(?=\[SCENE|\[QUIZ|$)/gi;

  let match;
  while ((match = sceneRegex.exec(text)) !== null) {
    const moduleNum = parseInt(match[1]);
    const screenNum = parseInt(match[2]);
    const block = match[3];

    // Split block into field map: "FIELD_NAME" -> "value"
    // This handles multiline values correctly by splitting on field boundaries
    const fieldMap = new Map<string, string>();
    const fieldSplitRegex = /\n([A-Z][A-Z_0-9]*):\s*/g;
    const fieldStarts: { name: string; start: number }[] = [];
    let fMatch;
    // Also check if block starts with a field (no leading newline)
    const leadingField = block.match(/^([A-Z][A-Z_0-9]*):\s*/);
    if (leadingField) {
      fieldStarts.push({
        name: leadingField[1],
        start: leadingField[0].length,
      });
    }
    while ((fMatch = fieldSplitRegex.exec(block)) !== null) {
      fieldStarts.push({
        name: fMatch[1],
        start: fMatch.index + fMatch[0].length,
      });
    }
    for (let fi = 0; fi < fieldStarts.length; fi++) {
      const start = fieldStarts[fi].start;
      const end =
        fi + 1 < fieldStarts.length
          ? block.lastIndexOf("\n", fieldStarts[fi + 1].start)
          : block.length;
      const value = block.substring(start, end).trim();
      if (value) {
        fieldMap.set(fieldStarts[fi].name, value);
      }
    }

    const getField = (name: string): string => fieldMap.get(name) ?? "";

    // Parse decision options (OPTION_1/FEEDBACK_1, OPTION_2/FEEDBACK_2, etc.)
    const decisionOptions: ParsedDecisionOption[] = [];
    const recommendedStr = getField("RECOMMENDED");
    const recommendedNum = parseInt(recommendedStr) || 0;

    for (let i = 1; i <= 4; i++) {
      const optLabel = getField(`OPTION_${i}`);
      const optFeedback = getField(`FEEDBACK_${i}`);
      if (optLabel) {
        decisionOptions.push({
          label: optLabel,
          feedback: optFeedback || "Consider this choice carefully.",
          isRecommended: i === recommendedNum,
        });
      }
    }

    scenes.push({
      moduleNum,
      screenNum,
      title: getField("TITLE"),
      storyText: getField("STORY_TEXT"),
      narration: getField("NARRATION"),
      onScreenText: getField("ON_SCREEN_TEXT"),
      visualDirection: getField("VISUAL_DIRECTION"),
      interactionType: getField("INTERACTION_TYPE"),
      interactionPrompt: getField("INTERACTION_PROMPT"),
      decisionOptions,
    });
  }

  return scenes;
}

function parseQuizzes(text: string): ParsedQuiz[] {
  const quizzes: ParsedQuiz[] = [];
  const quizRegex = /\[QUIZ\s+(\d+)\]\s*\n([\s\S]*?)(?=\[SCENE|\[QUIZ|$)/gi;

  let match;
  while ((match = quizRegex.exec(text)) !== null) {
    const moduleNum = parseInt(match[1]);
    const block = match[2];

    const questions: QuizQuestion[] = [];
    const qRegex =
      /\[Q\]\s*(.+?)\n\[A\]\s*(.+?)\n\[B\]\s*(.+?)\n\[C\]\s*(.+?)\n\[D\]\s*(.+?)\n\[ANSWER\]\s*([A-Da-d])/gi;

    let qMatch;
    while ((qMatch = qRegex.exec(block)) !== null) {
      const answerLetter = qMatch[6].toUpperCase();
      const answerIndex = "ABCD".indexOf(answerLetter);

      questions.push({
        type: "mcq",
        question: qMatch[1].trim(),
        choices: [
          qMatch[2].trim(),
          qMatch[3].trim(),
          qMatch[4].trim(),
          qMatch[5].trim(),
        ],
        answerIndex,
      });
    }

    if (questions.length > 0) {
      quizzes.push({ moduleNum, questions });
    }
  }

  return quizzes;
}

export async function generateCourse(
  sessionDir: string,
  extractedText: string,
  direction: StorySuggestion,
): Promise<Course> {
  const prompt = buildCoursePrompt(extractedText, direction);
  const assetsDir = path.join(sessionDir, "assets");

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview", //do not change this model!
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  console.log(
    "Gemini response parts:",
    parts.map((p) => p.text?.substring(0, 100) || "[image]"),
  );

  // Collect all text and track image positions
  let fullText = "";
  const imageBuffers: Buffer[] = [];
  const imagePositions: number[] = []; // character position where each image appeared

  for (const part of parts) {
    if (part.text) {
      fullText += part.text;
    } else if (part.inlineData) {
      imagePositions.push(fullText.length);
      const buffer = Buffer.from(part.inlineData.data!, "base64");
      imageBuffers.push(buffer);
    }
  }

  // Parse structured text
  const theme = parseTheme(fullText);
  const scenes = parseScenes(fullText);
  const quizzes = parseQuizzes(fullText);

  if (scenes.length === 0) {
    throw new Error(
      "Failed to parse any scenes from Gemini response. Raw text length: " +
        fullText.length,
    );
  }

  // Map images to scenes by order (each scene gets the next available image)
  const sceneImageMap = new Map<string, Buffer>();
  for (let i = 0; i < scenes.length && i < imageBuffers.length; i++) {
    const scene = scenes[i];
    const key = `m${scene.moduleNum}s${scene.screenNum}`;
    sceneImageMap.set(key, imageBuffers[i]);
  }

  // Save images and build course structure
  const moduleMap = new Map<
    number,
    { screens: Screen[]; quiz: QuizQuestion[] }
  >();

  for (const scene of scenes) {
    if (!moduleMap.has(scene.moduleNum)) {
      moduleMap.set(scene.moduleNum, { screens: [], quiz: [] });
    }

    const screenId = `m${scene.moduleNum}s${scene.screenNum}`;
    let imageInfo: Screen["image"] = null;

    const imgBuffer = sceneImageMap.get(screenId);
    if (imgBuffer) {
      const fileName = `${screenId}.png`;
      await writeFile(path.join(assetsDir, fileName), imgBuffer);
      imageInfo = {
        file: fileName,
        alt: scene.visualDirection || scene.title,
      };
    }

    const interactionType = scene.interactionType.toLowerCase();
    let interaction: Screen["interaction"] = null;

    if (interactionType !== "none" && scene.interactionPrompt) {
      interaction = {
        type: interactionType as "reflection" | "decision",
        prompt: scene.interactionPrompt,
      };

      // Attach decision options if this is a decision interaction
      if (interactionType === "decision" && scene.decisionOptions.length > 0) {
        interaction.options = scene.decisionOptions.map((opt) => ({
          label: opt.label,
          feedback: opt.feedback,
          isRecommended: opt.isRecommended,
        }));
      }
    }

    const screen: Screen = {
      id: screenId,
      title: scene.title,
      storyText: scene.storyText,
      narration: scene.narration,
      onScreenText: scene.onScreenText,
      image: imageInfo,
      audio: null,
      interaction,
    };

    moduleMap.get(scene.moduleNum)!.screens.push(screen);
  }

  // Attach quizzes
  for (const quiz of quizzes) {
    const mod = moduleMap.get(quiz.moduleNum);
    if (mod) {
      mod.quiz = quiz.questions;
    }
  }

  // Build course object
  const modules: Module[] = [];
  const sortedModuleNums = [...moduleMap.keys()].sort((a, b) => a - b);

  for (const modNum of sortedModuleNums) {
    const mod = moduleMap.get(modNum)!;
    modules.push({
      title: `Module ${modNum}`,
      narrativeTheme: direction.title,
      screens: mod.screens,
      quiz: mod.quiz,
    });
  }

  const course: Course = {
    title: direction.title,
    ...(theme && { theme }),
    modules,
  };

  // Save course JSON
  await writeFile(
    path.join(sessionDir, "course.json"),
    JSON.stringify(course, null, 2),
    "utf-8",
  );

  return course;
}
