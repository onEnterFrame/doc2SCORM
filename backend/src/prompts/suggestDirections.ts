export function buildSuggestPrompt(extractedText: string): string {
  const truncated = extractedText.substring(0, 8000);

  return `You are Doc2SCORM Director, an AI creative director for instructional design.

Analyze the following documentation and propose exactly 3 story-driven approaches for transforming it into an engaging eLearning course.

For each approach, provide:
- id: a snake_case identifier (e.g., "near_miss", "mentor_story")
- title: a compelling story title (e.g., "The Near Miss")
- description: 2-3 sentences describing the narrative approach and what the learner will experience
- tone: the emotional tone (e.g., "Dramatic, safety-focused")

Each approach should feel distinctly different — vary the narrative structure, perspective, and emotional register.

Respond ONLY with valid JSON matching this exact schema (no markdown fences, no explanation):
{
  "suggestions": [
    { "id": "string", "title": "string", "description": "string", "tone": "string" }
  ]
}

DOCUMENTATION:
${truncated}`;
}
