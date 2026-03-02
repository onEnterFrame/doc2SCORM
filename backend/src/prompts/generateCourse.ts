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

Before the first scene, output a theme block that matches the course content's mood and subject.
IMPORTANT: The app's default theme is already green — you MUST pick a DIFFERENT color palette. Never use green as the primary color.

[THEME]
GRADIENT_START: (hex color for background gradient start)
GRADIENT_END: (hex color for background gradient end, lighter/shifted hue from start)
ACCENT: (hex color for buttons and highlights, dark and saturated)
TEXT_ON_GLASS: (hex color for dark readable text on white glass cards)
TEXT_ON_GLASS_SECONDARY: (rgba color for lighter secondary text on glass)

Choose a distinctive palette that evokes the course topic:
- Cybersecurity → deep blues (#1e3a5f gradient, #2563eb accent, #1a2744 text)
- Cooking/food → warm amber (#d97706 gradient, #b45309 accent, #3d1c00 text)
- Healthcare → teal (#0d9488 gradient, #115e59 accent, #0f3d3a text)
- Finance → navy/gold (#1e3a5f gradient, #b8860b accent, #1a2744 text)
- Education → indigo/purple (#6366f1 gradient, #4338ca accent, #1e1b4b text)
- Safety/compliance → deep red/orange (#dc2626 gradient, #991b1b accent, #3b0a0a text)
- Technology → slate/cyan (#0891b2 gradient, #155e75 accent, #0c2d3d text)
- Nature/environment → earth tones (#a16207 gradient, #854d0e accent, #3b2506 text)

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
