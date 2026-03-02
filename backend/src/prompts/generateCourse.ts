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

Begin generating the course now.`;
}
