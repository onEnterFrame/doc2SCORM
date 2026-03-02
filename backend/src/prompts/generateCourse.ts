import type { StorySuggestion } from "../types/course.js";

export function buildCoursePrompt(
  extractedText: string,
  direction: StorySuggestion
): string {
  const truncated = extractedText.substring(0, 8000);

  return `You are Doc2SCORM Director generating a story-driven eLearning course.

STORY DIRECTION: "${direction.title}" - ${direction.description}
TONE: ${direction.tone}

SOURCE CONTENT:
${truncated}

Generate a course with EXACTLY 2 modules, each with 3-4 screens.

Before the first scene, output a theme block that matches the course content's mood and subject:

[THEME]
GRADIENT_START: (hex color for background gradient start, e.g. #6abf78)
GRADIENT_END: (hex color for background gradient end, e.g. #7acc8e)
ACCENT: (hex color for buttons and highlights, should be dark/saturated, e.g. #1b5e2f)
TEXT_ON_GLASS: (hex color for dark readable text on white glass cards, e.g. #1a3a2a)
TEXT_ON_GLASS_SECONDARY: (rgba color for secondary text on glass, e.g. rgba(26,58,42,0.7))

Pick colors that evoke the course topic. Examples:
- Cybersecurity → deep blues/teals (#1a2f4a, #2563eb)
- Cooking/food → warm amber/terracotta (#b45309, #d97706)
- Healthcare → clean blue-green (#0d9488, #115e59)
- Finance → navy/gold (#1e3a5f, #b8860b)

For EACH screen, output the following structured text block, then immediately generate an illustration:

[SCENE module.screen]
TITLE: (screen title)
STORY_TEXT: (narrative paragraph, 2-3 sentences from the learner's perspective)
NARRATION: (professional narrator script suitable for text-to-speech, 2-3 sentences)
ON_SCREEN_TEXT: (key takeaway, 1 sentence)
VISUAL_DIRECTION: (describe what the illustration should depict)
INTERACTION_TYPE: (one of: reflection, decision, none)
INTERACTION_PROMPT: (question or prompt for the learner, or "none")

If INTERACTION_TYPE is "decision", you MUST also include 2-3 options with feedback for each.
Use this exact format (one OPTION line per choice, one FEEDBACK line per choice, in order):
OPTION_1: (short action the learner could take, e.g. "Proceed without checking")
FEEDBACK_1: (1-2 sentence consequence/response if the learner picks this option)
OPTION_2: (another action)
FEEDBACK_2: (consequence for this option)
OPTION_3: (the best/recommended action)
FEEDBACK_3: (positive reinforcement explaining why this is correct)
RECOMMENDED: (number of the best option, e.g. 3)

Make sure options feel like real choices with real consequences. Bad choices should explain what could go wrong. The recommended choice should feel earned, not obvious.

Then immediately generate an illustration matching the VISUAL_DIRECTION.

CRITICAL — VISUAL STYLE CONSISTENCY:
Before generating any images, decide on ONE visual style for the entire course and use it for EVERY illustration. Choose from: flat vector illustration, isometric illustration, watercolor illustration, or minimal line art. Do NOT mix styles — no photorealistic images for some scenes and illustrations for others. Every image in the course must look like it belongs to the same visual set, with a consistent color palette, level of detail, and rendering technique throughout. State your chosen style in the VISUAL_DIRECTION of the first scene (e.g. "Style: flat vector illustration. ...") so all subsequent scenes follow it.

After all screens in each module, output a quiz block:

[QUIZ module_number]
[Q] (question text)
[A] (choice 1)
[B] (choice 2)
[C] (choice 3)
[D] (choice 4)
[ANSWER] (letter of correct answer)

Important rules:
- Number scenes as 1.1, 1.2, 1.3, 2.1, 2.2, 2.3 etc.
- Generate exactly one illustration after each scene's text block
- Keep narration concise and professional
- Make interactions meaningful — reflections should provoke thinking, decisions should have consequences
- Quiz questions should test key concepts from the source material
- Maintain the ${direction.tone} tone throughout
- NEVER reference images by filename or mention "image" in any text field (STORY_TEXT, NARRATION, ON_SCREEN_TEXT, INTERACTION_PROMPT, OPTION_*, FEEDBACK_*). The illustrations are displayed alongside the text automatically — the learner already sees them. Describe concepts directly instead of saying "in the image" or "as shown in image_0.png".

Begin generating the course now.`;
}
