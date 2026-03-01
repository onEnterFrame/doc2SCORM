Perfect. That extra “story selection” step is exactly what makes this feel like a **creative director agent** instead of a document converter.

Below is the fully rewritten PRD aligned tightly with storytelling and Creative Storyteller scoring.

---

# 📄 PRODUCT REQUIREMENTS DOCUMENT (PRD)

# Doc2SCORM Director

## Story-Driven Course Generator with Interleaved Multimedia Output

---

# 1. Product Vision

Doc2SCORM Director is a multimodal AI agent that transforms static documentation into narrative-driven learning experiences and packages them into SCORM-ready courses.

The agent behaves like a creative director:

1. Ingest documentation.
2. Propose multiple storytelling approaches.
3. Allow the user to choose a direction.
4. Generate a cohesive, multimedia course with interleaved visuals and narration.
5. Output a SCORM package ready for LMS deployment.

---

# 2. Goals

## Primary Goals

- Clearly demonstrate Gemini interleaved text + image generation.
- Deliver a narrative-first instructional design workflow.
- Produce a SCORM-compliant downloadable course.
- Run entirely on Google Cloud infrastructure.
- Be demo-ready within 2–4 minutes.

## Non-Goals

- Replace full authoring tools.
- Perfect long-form compliance training.
- Provide enterprise-level LMS analytics.

---

# 3. User Flow

---

## Step 1: Upload Documentation

User uploads:

- PDF
- DOCX
- Markdown
- Plain text

Backend:

- Stores file in Cloud Storage.
- Extracts plain text.

---

## Step 2: Story Direction Proposal (Creative Director Phase)

Gemini analyzes extracted content and proposes 3–4 story-driven approaches.

Example output:

```json
{
  "suggestions": [
    {
      "id": "near_miss",
      "title": "The Near Miss",
      "description": "A realistic workplace scenario where a small mistake nearly causes harm.",
      "tone": "Dramatic, safety-focused"
    },
    {
      "id": "mentor_story",
      "title": "The Experienced Mentor",
      "description": "A seasoned worker teaches a new hire through guided practice.",
      "tone": "Supportive, instructional"
    },
    {
      "id": "investigation",
      "title": "Incident Investigation",
      "description": "Learners analyze what went wrong and reconstruct correct procedures.",
      "tone": "Analytical, interactive"
    }
  ]
}
```

User selects one.

This reinforces:

- Creative agency
- Narrative framing
- Multimodal storytelling alignment

---

# 4. Course Generation Phase

After selection, Gemini generates:

- Course title
- 2–4 modules
- Story-driven scenes
- Interleaved illustrations
- Narration scripts
- Reflection or decision points
- Quiz questions

---

# 5. Interleaved Generation Requirements

Must use:

```js
model: "gemini-2.5-flash-image",
responseModalities: [Modality.TEXT, Modality.IMAGE]
```

Each scene must include:

```
[SCENE X]
TITLE:
NARRATION:
ON-SCREEN TEXT:
VISUAL DIRECTION:
INTERACTION (optional):
```

Immediately followed by:

- Inline illustration image (returned as inlineData)

The backend parses:

- `part.text`
- `part.inlineData`

And maps images to scene IDs.

---

# 6. Course JSON Schema

Canonical internal representation:

```json
{
  "title": "The Day the Machine Almost Started",
  "modules": [
    {
      "title": "A Close Call",
      "narrativeTheme": "Near Miss Scenario",
      "screens": [
        {
          "id": "m1s1",
          "title": "The Setup",
          "storyText": "Marcus was halfway through servicing the press...",
          "narration": "This near miss could have been fatal.",
          "image": {
            "file": "m1s1.png",
            "alt": "Technician servicing machine with warning tag"
          },
          "interaction": {
            "type": "reflection",
            "prompt": "What warning signs were missed?"
          }
        }
      ],
      "quiz": [
        {
          "type": "mcq",
          "question": "What is the first step in lockout?",
          "choices": [
            "Notify coworkers",
            "Disconnect power",
            "Start inspection",
            "Log paperwork"
          ],
          "answerIndex": 1
        }
      ]
    }
  ]
}
```

---

# 7. Narration Generation (TTS)

For each screen:

```js
const ttsResponse = await client.models.generateContent({
  model: "gemini-2.5-flash-preview-tts",
  contents: screen.narration,
});
```

Save audio file:

- `/assets/m1s1.mp3`

Attach to screen object.

---

# 8. SCORM Packaging

## SCORM 1.2 MVP

ZIP Structure:

```
/index.html
/imsmanifest.xml
/js/runtime.js
/course.json
/assets/*.png
/assets/*.mp3
```

Runtime:

- Tracks completion
- Tracks quiz score
- Supports suspend_data

Example SCORM call:

```js
scorm.set("cmi.core.lesson_status", "completed");
scorm.set("cmi.core.score.raw", score);
scorm.save();
```

---

# 9. Technical Architecture

Frontend:

- Vue 3
- Upload UI
- Story suggestion UI
- Live preview renderer
- SCORM download button

Backend (Cloud Run):

- `/api/upload`
- `/api/suggest-directions`
- `/api/generate-course`
- `/api/generate-audio`
- `/api/build-scorm`

Cloud Services:

- Cloud Run
- Vertex AI
- Cloud Storage
- Firestore (metadata)

---

# 10. Demo Flow

1. Upload boring safety manual.
2. Show AI proposing 3 story directions.
3. Select “Near Miss.”
4. Generate first module.
5. Show text appearing.
6. Image appears inline.
7. Play narration.
8. Show interaction.
9. Click Download SCORM.
10. Show SCORM zip.
11. Show Cloud Run console for deployment proof.

---

# 11. Judging Alignment

## Innovation & Multimodal UX (40%)

- Moves beyond chat.
- Interleaved text + images.
- Audio narration.
- Narrative cohesion.
- Feels like a creative director.

## Technical Execution (30%)

- GenAI SDK.
- Cloud Run.
- Vertex AI.
- SCORM packaging.
- Structured output validation.

## Demo & Presentation (30%)

- Clear problem.
- Real working software.
- Cloud deployment proof.
- Compelling transformation moment.

---

# 12. Risk Mitigation

- Limit generation to 2 modules.
- Limit screens to 4 per module.
- Enforce structured tags in prompt.
- Validate JSON before SCORM build.
- Retry once on malformed output.

---

This version strongly aligns with Creative Storyteller because:

- It emphasizes narrative weaving.
- It demonstrates interleaved media.
- It presents the AI as a creative director.
- It produces a cohesive multimedia experience.

---
