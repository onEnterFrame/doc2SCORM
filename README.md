# Doc2SCORM Director

### Gemini Live Agent Challenge — Creative Storyteller Category

> **An AI Creative Director that transforms static documents into immersive, story-driven eLearning courses** — with interleaved illustrations, adaptive color themes, professional narration, interactive decision points, quizzes, and a **public gallery** for sharing — all from a single multimodal Gemini generation.
>
> **Live app:** [https://doc2scorm-backend-[YOUR_HASH]-uc.a.run.app](https://doc2scorm-backend-[YOUR_HASH]-uc.a.run.app) *(update after deploy)*

---

## The Problem

Corporate training is broken. Subject matter experts write dense documents — compliance policies, onboarding guides, technical manuals — and expect people to learn from them. The result? Walls of text that nobody reads, zero engagement, zero retention.

Converting these documents into engaging eLearning courses currently requires a team of instructional designers, graphic artists, voice actors, and LMS developers. It takes weeks and costs thousands of dollars per course.

**Doc2SCORM Director solves this in under 2 minutes.** Upload a document, pick a narrative direction, and an AI Creative Director generates a complete, deployable course — with original illustrations, professional narration, interactive scenarios, and a beautiful adaptive UI — all packaged as a SCORM 1.2 ZIP ready for any Learning Management System. You can also **publish to a public gallery** and share a direct link — no LMS required.

---

## Demo Video

<!-- Replace with actual demo video -->
[Watch the 4-minute demo](https://www.youtube.com/PLACEHOLDER)

---

## Architecture

> Open [`architecture.html`](architecture.html) in a browser for the full interactive diagram.

![Architecture Diagram](architecture.html)

```
┌─────────────────┐                       ┌─────────────────────┐                          ┌──────────────────────┐
│   Vue 3 SPA     │       REST API        │  Express + TS       │    generateContent       │  Story Suggestions   │
│                 │ ─────────────────────▸ │                     │ ─────── (JSON) ─────────▸│  gemini-2.5-flash    │
│  5-Step Wizard  │                        │  8 REST endpoints   │                          └──────────────────────┘
│  + Gallery View │                        │                     │                          ┌──────────────────────┐
│  Glassmorphism  │ ◂──── SCORM ZIP ───── │  Text extraction    │ ── (TEXT + IMAGE) ──────▸│  Course + Images     │
│  Dynamic Themes │                        │  Course generation  │                          │  gemini-3.1-flash-   │
│  Audio player   │                        │  TTS encoding       │                          │  image-preview       │
│                 │                        │  SCORM packaging    │                          └──────────────────────┘
│  Pinia · Vite   │                        │  GCS publishing     │                          ┌──────────────────────┐
│                 │                        │  Google GenAI SDK   │ ─── (AUDIO PCM→WAV) ───▸│  Voice Narration     │
└─────────────────┘                        └───┬────────────┬────┘                          │  gemini-2.5-flash-   │
                                               │ File I/O   │ GCS Upload                   │  preview-tts         │
                                    ┌──────────▼──────┐  ┌──▼─────────────────┐            └──────────────────────┘
                                    │ Filesystem      │  │ Google Cloud       │
                                    │ output/{session} │  │ Storage (GCS)      │
                                    │ course.json ·   │  │ gallery.json       │
                                    │ *.png · *.wav   │  │ courses/{id}/      │
                                    │ course.zip      │  │ (public static)    │
                                    └─────────────────┘  └────────────────────┘
```

---

## Why This Wins: Breaking the Text Box

This project isn't a chatbot. It's an **autonomous creative agent** that thinks like a creative director — reading source material, making editorial decisions, and producing a cohesive multimedia experience in a single generation pass.

### See, Hear, and Interact

| Modality | What the Agent Produces | Gemini Capability |
|----------|------------------------|-------------------|
| **See** | Original illustrations in a consistent art style, plus an adaptive color theme that matches the course topic | Interleaved IMAGE output via `gemini-3.1-flash-image-preview` |
| **Hear** | Professional per-screen narration with custom audio player and transcript toggle | TTS via `gemini-2.5-flash-preview-tts`, PCM-to-WAV encoding |
| **Interact** | Decision points with branching consequences, reflection prompts, scored quizzes | Structured generation with `[SCENE]`/`[QUIZ]` parsing |
| **Adapt** | The entire UI shifts color palette to match course content (navy for cybersecurity, amber for cooking, etc.) | AI-selected `[THEME]` block with 5 CSS color tokens |
| **Share** | One-click publish to a public gallery with shareable GCS-hosted link — no LMS required | Google Cloud Storage static hosting + standalone player |

### The Interleaved Output — Our Core Innovation

Most AI apps make separate calls for text and images. Doc2SCORM Director uses **a single `generateContent` call** with `responseModalities: [TEXT, IMAGE]` that returns alternating text and inline image parts. This means:

1. **Narrative-visual coherence** — Each illustration is generated immediately after its scene description, in the same creative context
2. **Consistent art style** — Prompt engineering locks in one visual style (flat vector, watercolor, etc.) for the entire course
3. **Efficient generation** — One API call produces 6-8 screens worth of structured text + 6-8 original illustrations
4. **Atomic course creation** — The theme, story, visuals, interactions, and quizzes all come from the same creative "mind"

The response is then parsed from structured `[THEME]`, `[SCENE]`, and `[QUIZ]` blocks, images are extracted by position, and the result is assembled into a typed `Course` object that drives both the preview UI and the SCORM export.

---

## Gemini Models & Google GenAI SDK

Built entirely on the **Google GenAI SDK** (`@google/genai`). Three Gemini models work as a pipeline, each handling a different modality:

| Step | Model | Modalities | What It Does |
|------|-------|------------|-------------|
| **Suggest** | `gemini-2.5-flash` | Text → JSON | Analyzes source document and proposes 3 narrative directions with distinct titles, descriptions, and tones |
| **Generate** | `gemini-3.1-flash-image-preview` | Text → Text + Image (interleaved) | Produces the full course: color theme, story screens, interaction prompts, quiz questions, and inline illustrations |
| **Narrate** | `gemini-2.5-flash-preview-tts` | Text → Audio (PCM) | Generates professional narration for each screen, encoded from 24kHz/16-bit PCM to WAV |

### SDK Usage

```typescript
// Interleaved multimodal generation (courseGenerator.ts)
import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: "gemini-3.1-flash-image-preview",
  contents: [{ role: "user", parts: [{ text: prompt }] }],
  config: {
    responseModalities: [Modality.TEXT, Modality.IMAGE],  // Interleaved output
  },
});

// Response contains alternating text and inlineData (image) parts
for (const part of response.candidates[0].content.parts) {
  if (part.text) { /* Parse structured [SCENE]/[QUIZ] blocks */ }
  if (part.inlineData) { /* Save PNG illustration */ }
}
```

---

## Feature Deep-Dive

### 1. Multimodal Course Generation (Text + Image + Theme)

A single Gemini call produces:
- **`[THEME]` block** — 5 CSS color tokens (gradient start/end, accent, text colors) matched to the course topic
- **`[SCENE]` blocks** — Title, story text, narration script, on-screen takeaway, visual direction, interaction type
- **Inline illustrations** — Generated immediately after each scene, mapped to screens by position
- **`[QUIZ]` blocks** — Multiple-choice questions with correct answers
- **Decision interactions** — Options with consequences, recommended choices, and feedback text

### 2. AI-Adaptive Color Theming

The agent selects colors that **evoke the course subject**:
- Cybersecurity training → deep navy/electric blue
- Cooking course → warm amber/terracotta
- Healthcare compliance → teal/blue-green
- Finance fundamentals → navy/gold

The frontend smoothly transitions to the new palette using `@property`-registered CSS custom properties (native browser color interpolation at 1.2s). The SCORM export bakes the theme into CSS variables so the course displays with its unique visual identity in any LMS.

### 3. Professional TTS Narration

Every screen gets a narration audio track via `gemini-2.5-flash-preview-tts`. Raw PCM (24kHz, 16-bit, mono) is encoded to WAV by a custom encoder. The preview player auto-plays audio with scrubbing controls and a transcript toggle. **Graceful fallback**: if TTS fails for any screen, narration text is displayed instead — the course remains fully functional.

### 4. Interactive Decision Points

Scenes can include decision interactions where learners choose between 2-3 options, each with realistic consequences. Bad choices explain what could go wrong; the recommended choice provides positive reinforcement. This creates a branching narrative feel within a linear course structure.

### 5. SCORM 1.2 Export

The entire course is packaged as a standards-compliant SCORM 1.2 ZIP including:
- `imsmanifest.xml` — SCO metadata and resource declarations
- Custom glassmorphism player (`index.html` + `runtime.js`)
- All assets (PNG illustrations, WAV narration)
- `course.json` with full course data including theme
- SCORM API integration: `lesson_status`, `score.raw`, `suspend_data` for progress persistence

Upload the ZIP to **any** LMS — Moodle, SCORM Cloud, Blackboard, Canvas, TalentLMS, etc.

### 6. Public Gallery & Shareable Links

After generating a course, click **"Make Public"** to publish it to a browsable gallery. Published courses are uploaded as static files to **Google Cloud Storage**, so they load fast and require zero backend to view. Each course gets a shareable URL that opens a standalone player — the existing SCORM `runtime.js` already handles the no-LMS case gracefully (`findAPI()` returns null and all SCORM methods silently no-op).

- **Gallery view** — Toggle between the creator wizard and a gallery of all published courses
- **One-click publish** — Uploads `index.html`, `runtime.js`, `course.json`, and all assets to GCS
- **Shareable link** — Copy the public URL to share with anyone — no authentication needed
- **GCS bucket structure** — `gallery.json` index + per-course directories under `courses/{publishId}/`

---

## Error Handling & Robustness

| Scenario | How the Agent Handles It |
|----------|-------------------------|
| Malformed JSON from suggestion model | Auto-retries with explicit "respond only with JSON" correction prompt |
| TTS fails for a screen | Logs error, continues generation — `audio` stays null, player shows transcript text |
| No images returned by Gemini | Course renders with text-only screens (images are optional) |
| Theme block missing from response | Falls back to default green palette |
| Oversized document | Text truncated to 8,000 chars before sending to Gemini (prevents context overflow) |
| Upload too large | Multer enforces 10MB limit with clear error message |

---

## Google Cloud Deployment

The app runs as a **single Cloud Run container** (Express serves both API and Vue SPA) with a **GCS bucket** for the public gallery. One deploy script sets up everything.

### Quick Deploy

```bash
# Set your credentials
export GCP_PROJECT_ID=your-gcp-project
export GEMINI_API_KEY=your-api-key
# Optional: custom bucket name (default: doc2scorm-gallery)
export GCS_GALLERY_BUCKET=doc2scorm-gallery

# Deploy (creates GCS bucket + builds via Cloud Build + deploys to Cloud Run)
./deploy.sh
```

The deploy script will:
1. Create the GCS gallery bucket (if it doesn't exist) with public read access
2. Build the Docker image via Cloud Build
3. Deploy to Cloud Run with all required env vars (`GEMINI_API_KEY`, `GCS_GALLERY_BUCKET`)

### Manual Deploy

```bash
# 1. Create the GCS bucket for the public gallery
GALLERY_BUCKET="doc2scorm-gallery"
gcloud storage buckets create "gs://${GALLERY_BUCKET}" \
  --project $GCP_PROJECT_ID \
  --location us-central1 \
  --uniform-bucket-level-access
gcloud storage buckets add-iam-policy-binding "gs://${GALLERY_BUCKET}" \
  --member="allUsers" \
  --role="roles/storage.objectViewer"

# 2. Deploy the Cloud Run service
gcloud run deploy doc2scorm-backend \
  --project $GCP_PROJECT_ID \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --timeout 300 \
  --set-env-vars "GEMINI_API_KEY=$GEMINI_API_KEY,GCS_GALLERY_BUCKET=$GALLERY_BUCKET"
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes | — | Google AI API key for Gemini models |
| `GCS_GALLERY_BUCKET` | No | `doc2scorm-gallery` | GCS bucket name for the public gallery |
| `PORT` | No | `3456` (dev) / `8080` (prod) | Server port (Cloud Run sets this automatically) |

### How It Works

The multi-stage `Dockerfile` builds the Vue frontend, compiles the TypeScript backend, and produces a slim Node 22 Alpine image. In production, Express serves the SPA static files and catches all non-API routes with a fallback to `index.html`. The GCS gallery bucket is created with uniform bucket-level access and a public `objectViewer` binding so published courses are accessible to anyone.

On Cloud Run, GCS authentication is automatic via the service account — no credentials file needed. Locally, use `gcloud auth application-default login`.

> See the [Cloud Deployment Proof video](PLACEHOLDER) for a screen recording of the backend running on Google Cloud.

---

## Getting Started (Local Development)

### Prerequisites

- **Node.js** 18+
- **Gemini API Key** — get one free at [ai.google.dev](https://ai.google.dev/)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/doc2story.git
cd doc2story

# 2. Install all dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Configure your Gemini API key
echo "GEMINI_API_KEY=your_api_key_here" > .env

# 4. Start the app (backend on :3456, frontend on :5274)
npm run dev
```

Open **http://localhost:5274** in your browser. Upload any PDF, DOCX, Markdown, or text file to generate a course.

### Build for Production

```bash
# Type-check and build backend (tsc → dist/)
cd backend && npm run build

# Type-check and build frontend (vue-tsc + vite → dist/)
cd frontend && npm run build
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **AI** | Google GenAI SDK (`@google/genai`) | All Gemini model interactions |
| **Backend** | Express.js 5 + TypeScript (ESM) | REST API, generation orchestration |
| **Frontend** | Vue 3 + Pinia + Vite | 5-step wizard + gallery UI with reactive state |
| **Text Extraction** | `pdf-parse`, `mammoth`, `marked` | PDF, DOCX, Markdown, TXT support |
| **Audio** | Custom `wavEncoder.ts` | PCM 24kHz/16-bit → WAV encoding |
| **Packaging** | `archiver` | SCORM 1.2 ZIP assembly |
| **SCORM Runtime** | Vanilla JS (`runtime.js`) | LMS API discovery, player, quiz scoring |
| **Gallery** | `@google-cloud/storage` | GCS upload, gallery.json management |
| **Styling** | Glassmorphism CSS + `@property` | Dynamic theming with smooth transitions |
| **Cloud** | Google Cloud Run + Cloud Storage | Backend hosting + public gallery CDN |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload document (multipart/form-data), extract text, return session ID |
| `POST` | `/api/suggest-directions` | Generate 3 narrative direction proposals (JSON) |
| `POST` | `/api/generate-course` | Generate full course with interleaved text + images + theme |
| `GET`  | `/api/course/:sessionId` | Fetch course JSON (refreshed after TTS adds audio references) |
| `POST` | `/api/generate-audio` | Generate TTS narration for all screens |
| `POST` | `/api/build-scorm` | Package everything into SCORM 1.2 ZIP |
| `GET`  | `/api/download/:sessionId/course.zip` | Download the SCORM package |
| `POST` | `/api/publish` | Publish course to GCS public gallery, return shareable URL |
| `GET`  | `/api/gallery` | Fetch all published courses from the gallery |

---

## Project Structure

```
doc2story/
├── backend/src/
│   ├── index.ts                    # Express server, route registration
│   ├── routes/
│   │   ├── upload.ts               # POST /api/upload
│   │   ├── suggest.ts              # POST /api/suggest-directions
│   │   ├── generate.ts             # POST /api/generate-course, GET /api/course/:id
│   │   ├── audio.ts                # POST /api/generate-audio
│   │   ├── scorm.ts                # POST /api/build-scorm, GET /api/download
│   │   └── publish.ts              # POST /api/publish, GET /api/gallery
│   ├── services/
│   │   ├── gemini.ts               # GenAI SDK client singleton
│   │   ├── extractText.ts          # PDF/DOCX/MD/TXT extraction
│   │   ├── courseGenerator.ts       # Interleaved generation + response parsing
│   │   ├── ttsGenerator.ts         # Per-screen TTS + WAV encoding
│   │   ├── scormPackager.ts        # ZIP assembly with manifest
│   │   └── gcsPublisher.ts         # GCS upload + gallery.json management
│   ├── prompts/
│   │   ├── suggestDirections.ts    # Suggestion prompt (JSON output)
│   │   └── generateCourse.ts       # Course prompt ([THEME]/[SCENE]/[QUIZ])
│   ├── templates/
│   │   ├── imsmanifest.xml         # SCORM manifest template
│   │   ├── index.html              # Glassmorphism SCORM player (also used for GCS)
│   │   └── runtime.js              # SCORM API + renderer + theme application
│   ├── types/course.ts             # CourseTheme, Course, Module, Screen, Quiz, GalleryEntry
│   └── utils/wavEncoder.ts         # PCM → WAV header encoder
├── frontend/src/
│   ├── App.vue                     # Root layout, gallery toggle, @property CSS
│   ├── stores/courseStore.ts        # Pinia state + publish actions
│   ├── components/
│   │   ├── FileUpload.vue          # Drag-drop upload
│   │   ├── StoryPicker.vue         # 3 direction cards
│   │   ├── GenerationProgress.vue   # Stage progress + theme trigger
│   │   ├── CoursePreview.vue        # Full slide player + audio + interactions
│   │   ├── ScormDownload.vue        # Download stats + publish to gallery
│   │   └── GalleryView.vue         # Public gallery with course cards
│   └── types/course.ts             # Frontend type definitions (incl. GalleryEntry)
├── architecture.html               # Interactive architecture diagram
├── deploy.sh                       # Cloud Run + GCS bucket deployment
├── Dockerfile                      # Cloud Run container (Node 22 Alpine)
├── package.json                    # Monorepo (concurrently)
└── .env                            # GEMINI_API_KEY (not committed)
```

---

## Competition Checklist

| Requirement | Status | Details |
|---|---|---|
| Leverages a Gemini model | **3 models** | `gemini-2.5-flash`, `gemini-3.1-flash-image-preview`, `gemini-2.5-flash-preview-tts` |
| Built with Google GenAI SDK | Yes | `@google/genai` — see `backend/src/services/gemini.ts` |
| Uses Google Cloud service | **2 services** | Cloud Run (backend) + Cloud Storage (public gallery) |
| Interleaved/mixed output | Yes | `responseModalities: [TEXT, IMAGE]` — core of course generation |
| Text description | Yes | This README |
| Public code repository | Yes | This repository |
| Cloud deployment proof | Yes | [See recording](PLACEHOLDER) |
| Architecture diagram | Yes | [`architecture.html`](architecture.html) |
| Demo video (<4 min) | Yes | [Watch demo](PLACEHOLDER) |

---

## Findings & Learnings

### What Worked Well
- **Interleaved generation is magical** — Getting text and images from a single call produces far more coherent results than generating them separately. The model "knows" what it just illustrated and writes accordingly.
- **Structured output parsing** — Using tagged blocks (`[THEME]`, `[SCENE]`, `[QUIZ]`) with field-name boundaries gave reliable structured data even from a free-form multimodal response.
- **Glassmorphism + dynamic theming** — White glass overlays are color-agnostic by nature, making the entire UI theme-able with just 5 CSS variables.
- **`@property` CSS registration** — A game-changer for smooth theme transitions. Without it, CSS custom properties change instantly. With it, the browser interpolates between colors over 1.2 seconds.

### Challenges & Solutions
- **Image-to-scene mapping** — Gemini returns images as `inlineData` parts mixed with text parts. We map them to scenes by sequential position (first image → first scene), which works because the model generates them in order.
- **Model referencing its own images** — The model sometimes wrote "as shown in image_0.png" in interaction prompts. Solved with an explicit prompt rule: "NEVER reference images by filename — they are displayed alongside the text automatically."
- **Theme color anchoring** — When all example colors in the prompt were green, the model picked green every time regardless of topic. Solved by removing green examples entirely and adding "the default is already green — you MUST pick a different palette."
- **TTS reliability** — TTS occasionally fails for individual screens. Rather than failing the entire course, we catch errors per-screen and fall back to text transcripts.

---

## License

MIT

---

*Built for the [Gemini Live Agent Challenge](https://ai.google.dev/gemini-api/docs) — Creative Storyteller Category*

*#GeminiLiveAgentChallenge*
