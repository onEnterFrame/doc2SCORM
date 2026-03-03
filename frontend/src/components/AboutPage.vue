<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from "vue";
import { useCourseStore } from "../stores/courseStore";

const store = useCourseStore();
const visibleSections = reactive(new Set<string>());
let observer: IntersectionObserver | null = null;

const sectionRefs = ref<HTMLElement[]>([]);

function setSectionRef(el: any) {
  if (el) sectionRefs.value.push(el);
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const name = (entry.target as HTMLElement).dataset.section;
          if (name) visibleSections.add(name);
          observer?.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  sectionRefs.value.forEach((el) => observer?.observe(el));
});

onUnmounted(() => {
  observer?.disconnect();
});

const pipelineSteps = [
  { icon: "📄", label: "Upload", detail: "PDF, DOCX, MD, TXT" },
  { icon: "🔍", label: "Extract", detail: "Text parsing" },
  { icon: "💡", label: "Suggest", detail: "3 story directions" },
  { icon: "🎬", label: "Generate", detail: "Scenes + images" },
  { icon: "🔊", label: "TTS", detail: "AI narration" },
  { icon: "📦", label: "SCORM", detail: "Package ZIP" },
  { icon: "🚀", label: "Publish", detail: "Cloud deploy" },
];

const modalities = [
  {
    icon: "👁",
    title: "See",
    desc: "AI-generated scene illustrations bring each story moment to life with contextual imagery.",
    badge: "gemini-2.0-flash-exp",
  },
  {
    icon: "👂",
    title: "Hear",
    desc: "Natural TTS narration with configurable voices turns text into engaging audio experiences.",
    badge: "gemini-2.5-flash-tts",
  },
  {
    icon: "🖱",
    title: "Interact",
    desc: "Decision points and branching scenarios let learners shape their own story path.",
    badge: "Interactive scenes",
  },
  {
    icon: "📝",
    title: "Adapt",
    desc: "Quizzes with contextual feedback reinforce learning and track comprehension.",
    badge: "Quiz engine",
  },
  {
    icon: "📤",
    title: "Share",
    desc: "SCORM 1.2 packages deploy to any LMS with progress tracking and scoring.",
    badge: "SCORM 1.2",
  },
];

const models = [
  {
    step: "Step 2",
    name: "gemini-2.5-flash",
    desc: "Analyzes extracted document text and generates three distinct narrative directions, each with a unique genre, tone, and story framework.",
    input: "Document text",
    output: "3 story directions",
    color: "#4285f4",
  },
  {
    step: "Step 3",
    name: "gemini-2.0-flash-exp",
    desc: "Generates complete course content with interleaved text and images in a single pass using multimodal output capabilities.",
    input: "Story direction + text",
    output: "Scenes + images",
    color: "#ea4335",
  },
  {
    step: "Step 4",
    name: "gemini-2.5-flash-tts",
    desc: "Converts narration scripts into natural-sounding audio with PCM 24kHz output, encoded to WAV for universal playback.",
    input: "Narration text",
    output: "WAV audio",
    color: "#fbbc04",
  },
];

const techStack = [
  {
    category: "AI / Models",
    items: [
      "Google Gemini",
      "Multimodal Generation",
      "Text-to-Speech",
      "Interleaved Output",
    ],
  },
  {
    category: "Backend",
    items: [
      "Node.js",
      "Express",
      "TypeScript",
      "Multer",
      "Archiver",
    ],
  },
  {
    category: "Frontend",
    items: [
      "Vue 3",
      "Vite",
      "Pinia",
      "TypeScript",
      "CSS Glassmorphism",
    ],
  },
  {
    category: "Infrastructure",
    items: [
      "SCORM 1.2",
      "Filesystem Storage",
      "REST API",
      "Hot Reload (tsx)",
    ],
  },
];
</script>

<template>
  <div class="about-page">
    <!-- Section 1: Hero -->
    <section
      class="about-section hero-section"
      :class="{ visible: visibleSections.has('hero') }"
      data-section="hero"
      :ref="setSectionRef"
    >
      <span class="eyebrow-pill" :style="{ '--delay': '0ms' }">Powered by Gemini</span>
      <h2 class="hero-headline" :style="{ '--delay': '80ms' }">
        Transform Documents into<br />
        <span class="hero-highlight">Story-Driven Learning</span>
      </h2>
      <p class="hero-subtitle" :style="{ '--delay': '160ms' }">
        An AI creative director that turns static PDFs and docs into immersive,
        narrated SCORM courses — with generated illustrations, branching
        decisions, and natural voice narration.
      </p>
      <div class="hero-actions" :style="{ '--delay': '240ms' }">
        <button class="btn btn-primary" @click="store.view = 'wizard'">
          Try It Now
        </button>
        <a
          class="btn btn-secondary"
          href="/architecture.html"
          target="_blank"
          rel="noopener"
        >
          View Architecture
        </a>
      </div>
    </section>

    <!-- Section 2: Pipeline -->
    <section
      class="about-section"
      :class="{ visible: visibleSections.has('pipeline') }"
      data-section="pipeline"
      :ref="setSectionRef"
    >
      <h3 class="section-title">How It Works</h3>
      <p class="section-subtitle">Seven steps from document to deployed course</p>
      <div class="pipeline">
        <template v-for="(step, i) in pipelineSteps" :key="step.label">
          <div class="pipeline-step" :style="{ '--delay': i * 80 + 'ms' }">
            <div class="pipeline-icon">{{ step.icon }}</div>
            <div class="pipeline-label">{{ step.label }}</div>
            <div class="pipeline-detail">{{ step.detail }}</div>
          </div>
          <svg
            v-if="i < pipelineSteps.length - 1"
            class="pipeline-arrow"
            :style="{ '--delay': i * 80 + 40 + 'ms' }"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </template>
      </div>
    </section>

    <!-- Section 3: Modalities -->
    <section
      class="about-section"
      :class="{ visible: visibleSections.has('modalities') }"
      data-section="modalities"
      :ref="setSectionRef"
    >
      <h3 class="section-title">Five Learning Modalities</h3>
      <p class="section-subtitle">Every course engages learners through multiple channels</p>
      <div class="modalities-grid">
        <div
          v-for="(m, i) in modalities"
          :key="m.title"
          class="glass-card modality-card"
          :style="{ '--delay': i * 80 + 'ms' }"
        >
          <div class="modality-icon">{{ m.icon }}</div>
          <h4 class="modality-title">{{ m.title }}</h4>
          <p class="modality-desc">{{ m.desc }}</p>
          <span class="model-badge">{{ m.badge }}</span>
        </div>
      </div>
    </section>

    <!-- Section 4: Core Innovation -->
    <section
      class="about-section"
      :class="{ visible: visibleSections.has('innovation') }"
      data-section="innovation"
      :ref="setSectionRef"
    >
      <div class="glass-card glass-card-strong innovation-card" :style="{ '--delay': '0ms' }">
        <span class="innovation-badge">Core Innovation</span>
        <h3 class="innovation-title">Interleaved Multimodal Generation</h3>
        <p class="innovation-desc">
          Unlike chained pipelines that generate text then images separately,
          Doc2SCORM uses Gemini's
          <code>responseModalities: [TEXT, IMAGE]</code> to produce
          <strong>alternating text and image parts</strong> in a single API call.
          The model weaves narrative, scene descriptions, and illustrations
          together — ensuring visual coherence with story content.
        </p>
        <div class="interleaved-demo" :style="{ '--delay': '120ms' }">
          <div class="interleaved-block text-block">TEXT</div>
          <div class="interleaved-block image-block">IMAGE</div>
          <div class="interleaved-block text-block">TEXT</div>
          <div class="interleaved-block image-block">IMAGE</div>
          <div class="interleaved-block text-block">TEXT</div>
          <div class="interleaved-block image-block">IMAGE</div>
        </div>
      </div>
    </section>

    <!-- Section 5: Models -->
    <section
      class="about-section"
      :class="{ visible: visibleSections.has('models') }"
      data-section="models"
      :ref="setSectionRef"
    >
      <h3 class="section-title">Three Gemini Models</h3>
      <p class="section-subtitle">Each step uses a specialized model for optimal results</p>
      <div class="models-grid">
        <div
          v-for="(m, i) in models"
          :key="m.name"
          class="glass-card model-card"
          :style="{ '--delay': i * 100 + 'ms', '--accent-bar': m.color }"
        >
          <div class="model-accent-bar"></div>
          <span class="model-step-badge">{{ m.step }}</span>
          <h4 class="model-name">{{ m.name }}</h4>
          <p class="model-desc">{{ m.desc }}</p>
          <div class="model-io">
            <span class="io-pill io-input">{{ m.input }}</span>
            <span class="io-arrow">&rarr;</span>
            <span class="io-pill io-output">{{ m.output }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 6: Tech Stack -->
    <section
      class="about-section"
      :class="{ visible: visibleSections.has('tech') }"
      data-section="tech"
      :ref="setSectionRef"
    >
      <h3 class="section-title">Tech Stack</h3>
      <p class="section-subtitle">Built with modern, production-ready technologies</p>
      <div class="tech-rows">
        <div
          v-for="(row, i) in techStack"
          :key="row.category"
          class="tech-row"
          :style="{ '--delay': i * 80 + 'ms' }"
        >
          <span class="tech-category">{{ row.category }}</span>
          <div class="tech-badges">
            <span v-for="item in row.items" :key="item" class="tech-badge">
              {{ item }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 7: CTA Footer -->
    <section
      class="about-section"
      :class="{ visible: visibleSections.has('cta') }"
      data-section="cta"
      :ref="setSectionRef"
    >
      <div class="glass-card cta-card" :style="{ '--delay': '0ms' }">
        <h3 class="cta-title">Ready to transform your documents?</h3>
        <p class="cta-desc">
          Upload a PDF, DOCX, or text file and watch AI turn it into an
          interactive learning experience in minutes.
        </p>
        <button class="btn btn-primary" @click="store.view = 'wizard'">
          Start Creating
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ==============================
   About Page Layout
   ============================== */
.about-page {
  display: flex;
  flex-direction: column;
  gap: 56px;
  padding-bottom: 32px;
}

.about-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* ==============================
   Scroll Reveal System
   ============================== */
.about-section > * {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
  transition-delay: var(--delay, 0ms);
}

.about-section.visible > * {
  opacity: 1;
  transform: translateY(0);
}

/* ==============================
   Shared Glass Card
   ============================== */
.glass-card {
  background: var(--glass);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  padding: 24px;
  transition: opacity 0.5s ease, transform 0.5s ease, background 0.3s ease,
    border-color 0.3s ease;
  transition-delay: var(--delay, 0ms);
}

.glass-card-strong {
  background: var(--glass-strong);
}

/* ==============================
   Section 1: Hero
   ============================== */
.hero-section {
  padding-top: 24px;
}

.eyebrow-pill {
  display: inline-block;
  padding: 6px 18px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 0.8em;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.03em;
  margin-bottom: 20px;
}

.hero-headline {
  font-family: var(--font-display);
  font-size: 2.6em;
  font-weight: 700;
  line-height: 1.15;
  color: #fff;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

.hero-highlight {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 255, 255, 0.7) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  max-width: 600px;
  font-size: 1.05em;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 28px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

/* ==============================
   Section Titles
   ============================== */
.section-title {
  font-family: var(--font-display);
  font-size: 1.6em;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.section-subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95em;
  margin-bottom: 32px;
}

/* ==============================
   Section 2: Pipeline
   ============================== */
.pipeline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.pipeline-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
  transition-delay: var(--delay, 0ms);
}

.about-section.visible .pipeline-step,
.about-section.visible .pipeline-arrow {
  opacity: 1;
  transform: translateY(0);
}

.pipeline-arrow {
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
  transition-delay: var(--delay, 0ms);
}

.pipeline-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--glass);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5em;
}

.pipeline-label {
  font-weight: 600;
  font-size: 0.85em;
  color: #fff;
}

.pipeline-detail {
  font-size: 0.72em;
  color: rgba(255, 255, 255, 0.6);
}

/* ==============================
   Section 3: Modalities
   ============================== */
.modalities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  width: 100%;
}

.modality-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 24px 16px;
}

.modality-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4em;
  margin-bottom: 4px;
}

.modality-title {
  font-family: var(--font-display);
  font-size: 1.1em;
  font-weight: 700;
  color: var(--text-on-glass);
}

.modality-desc {
  font-size: 0.82em;
  line-height: 1.5;
  color: var(--text-on-glass-secondary);
}

.model-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.25);
  font-size: 0.68em;
  font-weight: 600;
  color: var(--text-on-glass-secondary);
  margin-top: auto;
}

/* ==============================
   Section 4: Core Innovation
   ============================== */
.innovation-card {
  max-width: 680px;
  width: 100%;
  text-align: center;
}

.innovation-badge {
  display: inline-block;
  padding: 4px 14px;
  border-radius: var(--radius-pill);
  background: var(--accent);
  color: #fff;
  font-size: 0.75em;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.innovation-title {
  font-family: var(--font-display);
  font-size: 1.4em;
  font-weight: 700;
  color: var(--text-on-glass);
  margin-bottom: 12px;
}

.innovation-desc {
  font-size: 0.9em;
  line-height: 1.65;
  color: var(--text-on-glass-secondary);
  margin-bottom: 20px;
}

.innovation-desc code {
  background: rgba(255, 255, 255, 0.25);
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 0.88em;
  font-family: "SF Mono", "Fira Code", monospace;
}

.interleaved-demo {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
  transition-delay: var(--delay, 0ms);
}

.about-section.visible .interleaved-demo {
  opacity: 1;
  transform: translateY(0);
}

.interleaved-block {
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  font-size: 0.78em;
  font-weight: 700;
  letter-spacing: 0.05em;
  animation: interleavedPulse 2.5s ease-in-out infinite;
}

.text-block {
  background: rgba(66, 133, 244, 0.2);
  border: 1px solid rgba(66, 133, 244, 0.35);
  color: #4285f4;
}

.image-block {
  background: rgba(234, 67, 53, 0.2);
  border: 1px solid rgba(234, 67, 53, 0.35);
  color: #ea4335;
  animation-delay: 0.3s;
}

@keyframes interleavedPulse {
  0%,
  100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.04);
  }
}

/* ==============================
   Section 5: Models
   ============================== */
.models-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
}

.model-card {
  position: relative;
  overflow: hidden;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.model-accent-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--accent-bar);
  border-radius: var(--radius) var(--radius) 0 0;
}

.model-step-badge {
  display: inline-block;
  width: fit-content;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.18);
  font-size: 0.7em;
  font-weight: 700;
  color: var(--text-on-glass-secondary);
  margin-top: 4px;
}

.model-name {
  font-family: "SF Mono", "Fira Code", monospace;
  font-size: 0.9em;
  font-weight: 700;
  color: var(--text-on-glass);
}

.model-desc {
  font-size: 0.8em;
  line-height: 1.55;
  color: var(--text-on-glass-secondary);
  flex: 1;
}

.model-io {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: auto;
}

.io-pill {
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  font-size: 0.7em;
  font-weight: 600;
}

.io-input {
  background: rgba(66, 133, 244, 0.15);
  border: 1px solid rgba(66, 133, 244, 0.3);
  color: var(--text-on-glass-secondary);
}

.io-output {
  background: rgba(52, 168, 83, 0.15);
  border: 1px solid rgba(52, 168, 83, 0.3);
  color: var(--text-on-glass-secondary);
}

.io-arrow {
  color: var(--text-on-glass-secondary);
  font-size: 0.8em;
}

/* ==============================
   Section 6: Tech Stack
   ============================== */
.tech-rows {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.tech-row {
  display: flex;
  align-items: center;
  gap: 16px;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
  transition-delay: var(--delay, 0ms);
}

.about-section.visible .tech-row {
  opacity: 1;
  transform: translateY(0);
}

.tech-category {
  font-weight: 700;
  font-size: 0.82em;
  color: rgba(255, 255, 255, 0.7);
  min-width: 110px;
  text-align: right;
  flex-shrink: 0;
}

.tech-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tech-badge {
  padding: 5px 14px;
  border-radius: var(--radius-pill);
  background: var(--glass);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid var(--glass-border);
  font-size: 0.8em;
  font-weight: 600;
  color: var(--text-on-glass);
}

/* ==============================
   Section 7: CTA Footer
   ============================== */
.cta-card {
  max-width: 520px;
  width: 100%;
  text-align: center;
  padding: 40px 32px;
}

.cta-title {
  font-family: var(--font-display);
  font-size: 1.4em;
  font-weight: 700;
  color: var(--text-on-glass);
  margin-bottom: 10px;
}

.cta-desc {
  font-size: 0.9em;
  line-height: 1.6;
  color: var(--text-on-glass-secondary);
  margin-bottom: 24px;
}

/* ==============================
   Responsive
   ============================== */
@media (max-width: 768px) {
  .hero-headline {
    font-size: 1.8em;
  }

  .hero-subtitle {
    font-size: 0.95em;
  }

  .pipeline {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 16px;
  }

  .pipeline-arrow {
    display: none;
  }

  .models-grid {
    grid-template-columns: 1fr;
  }

  .tech-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .tech-category {
    text-align: left;
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .hero-headline {
    font-size: 1.5em;
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .modalities-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
