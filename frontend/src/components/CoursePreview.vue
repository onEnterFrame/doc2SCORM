<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useCourseStore } from "../stores/courseStore";
import type { Screen, QuizQuestion } from "../types/course";
import AudioPlayer from "./AudioPlayer.vue";

const store = useCourseStore();

interface SlideScreen {
  kind: "screen";
  screen: Screen;
  moduleIndex: number;
  moduleTitle: string;
  isModuleStart: boolean;
}
interface SlideQuiz {
  kind: "quiz";
  questions: QuizQuestion[];
  moduleIndex: number;
  moduleTitle: string;
}
type Slide = SlideScreen | SlideQuiz;

const slides = computed<Slide[]>(() => {
  if (!store.courseData) return [];
  const list: Slide[] = [];
  for (let mi = 0; mi < store.courseData.modules.length; mi++) {
    const mod = store.courseData.modules[mi];
    for (let si = 0; si < mod.screens.length; si++) {
      list.push({
        kind: "screen",
        screen: mod.screens[si],
        moduleIndex: mi,
        moduleTitle: mod.title,
        isModuleStart: si === 0,
      });
    }
    if (mod.quiz && mod.quiz.length > 0) {
      list.push({
        kind: "quiz",
        questions: mod.quiz,
        moduleIndex: mi,
        moduleTitle: mod.title,
      });
    }
  }
  return list;
});

const currentIndex = ref(0);
const audioRef = ref<InstanceType<typeof AudioPlayer> | null>(null);
const autoPlay = ref(true);
const showTranscript = ref(false);
const slideDirection = ref<"next" | "prev">("next");

const currentSlide = computed(() => slides.value[currentIndex.value]);
const isFirst = computed(() => currentIndex.value === 0);
const isLast = computed(() => currentIndex.value === slides.value.length - 1);
const progress = computed(
  () => ((currentIndex.value + 1) / slides.value.length) * 100
);

const decisionChoices = ref<Record<string, number | null>>({});

function getDecisionChoice(screenId: string): number | null {
  return decisionChoices.value[screenId] ?? null;
}

function selectDecision(screenId: string, optionIndex: number) {
  if (decisionChoices.value[screenId] != null) return;
  decisionChoices.value[screenId] = optionIndex;
}

const quizAnswers = ref<Record<string, number | null>>({});
const quizRevealed = ref<Record<string, boolean>>({});

function quizKey(moduleIndex: number, questionIndex: number) {
  return `${moduleIndex}-${questionIndex}`;
}

function selectAnswer(moduleIndex: number, questionIndex: number, choiceIndex: number) {
  const key = quizKey(moduleIndex, questionIndex);
  if (quizRevealed.value[key]) return;
  quizAnswers.value[key] = choiceIndex;
  quizRevealed.value[key] = true;
}

function getAnswer(moduleIndex: number, questionIndex: number): number | null {
  return quizAnswers.value[quizKey(moduleIndex, questionIndex)] ?? null;
}

function isRevealed(moduleIndex: number, questionIndex: number): boolean {
  return !!quizRevealed.value[quizKey(moduleIndex, questionIndex)];
}

function imageUrl(file: string) {
  return `/api/assets/${store.sessionId}/assets/${file}`;
}

function audioUrl(file: string) {
  return `/api/assets/${store.sessionId}/assets/${file}`;
}

function prev() {
  if (currentIndex.value > 0) {
    stopAudio();
    slideDirection.value = "prev";
    currentIndex.value--;
  }
}

function next() {
  if (currentIndex.value < slides.value.length - 1) {
    stopAudio();
    slideDirection.value = "next";
    currentIndex.value++;
  }
}

const currentAudioSrc = computed(() => {
  const s = currentSlide.value;
  if (s?.kind === "screen" && s.screen.audio) {
    return audioUrl(s.screen.audio.file);
  }
  return null;
});

const currentNarration = computed(() => {
  const s = currentSlide.value;
  return s?.kind === "screen" ? s.screen.narration ?? null : null;
});

function stopAudio() {
  audioRef.value?.stop();
}

watch(currentIndex, () => {
  stopAudio();
});
</script>

<template>
  <div v-if="store.courseData && currentSlide" class="player">
    <!-- Header -->
    <div class="player-header">
      <h2 class="course-title">{{ store.courseData.title }}</h2>
      <div class="player-meta">
        {{ currentIndex + 1 }} / {{ slides.length }}
      </div>
    </div>

    <!-- Progress bar -->
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: progress + '%' }"></div>
    </div>

    <!-- Module banner -->
    <Transition name="banner">
      <div
        v-if="currentSlide.kind === 'screen' && currentSlide.isModuleStart"
        :key="'banner-' + currentSlide.moduleIndex"
        class="module-banner"
      >
        {{ currentSlide.moduleTitle }}
      </div>
    </Transition>

    <!-- Slide content -->
    <Transition :name="'slide-' + slideDirection" mode="out-in">
      <!-- Screen slide -->
      <div v-if="currentSlide.kind === 'screen'" :key="'s-' + currentIndex" class="slide">
        <h3 class="screen-title">{{ currentSlide.screen.title }}</h3>

        <img
          v-if="currentSlide.screen.image"
          :src="imageUrl(currentSlide.screen.image.file)"
          :alt="currentSlide.screen.image.alt"
          class="screen-image"
        />

        <div class="story-text">{{ currentSlide.screen.storyText }}</div>

        <p v-if="currentSlide.screen.onScreenText" class="on-screen-text">
          {{ currentSlide.screen.onScreenText }}
        </p>

        <!-- Narration text fallback (no audio) -->
        <div
          v-if="!currentSlide.screen.audio && currentSlide.screen.narration"
          class="narration-fallback"
        >
          <span class="narration-label">Narration</span>
          <p class="narration-text">"{{ currentSlide.screen.narration }}"</p>
        </div>

        <!-- Reflection -->
        <div
          v-if="
            currentSlide.screen.interaction &&
            currentSlide.screen.interaction.type === 'reflection'
          "
          class="interaction-box"
        >
          <div class="interaction-header">
            <span class="interaction-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Reflection
            </span>
          </div>
          <p class="interaction-prompt">
            {{ currentSlide.screen.interaction.prompt }}
          </p>
        </div>

        <!-- Decision -->
        <div
          v-if="
            currentSlide.screen.interaction &&
            currentSlide.screen.interaction.type === 'decision'
          "
          class="interaction-box"
        >
          <div class="interaction-header">
            <span class="interaction-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 16 16 12 12 8"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              Decision Point
            </span>
          </div>
          <p class="interaction-prompt">
            {{ currentSlide.screen.interaction.prompt }}
          </p>

          <div
            v-if="currentSlide.screen.interaction.options?.length"
            class="decision-options"
          >
            <button
              v-for="(opt, oi) in currentSlide.screen.interaction.options"
              :key="oi"
              class="decision-btn"
              :class="{
                chosen: getDecisionChoice(currentSlide.screen.id) === oi,
                recommended:
                  getDecisionChoice(currentSlide.screen.id) != null &&
                  opt.isRecommended,
                unchosen:
                  getDecisionChoice(currentSlide.screen.id) != null &&
                  getDecisionChoice(currentSlide.screen.id) !== oi &&
                  !opt.isRecommended,
              }"
              :disabled="getDecisionChoice(currentSlide.screen.id) != null"
              @click="selectDecision(currentSlide.screen.id, oi)"
            >
              <!-- Icon: chosen check, recommended star, default circle -->
              <span class="decision-icon">
                <svg v-if="getDecisionChoice(currentSlide.screen.id) === oi" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <svg v-else-if="getDecisionChoice(currentSlide.screen.id) != null && opt.isRecommended" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span v-else class="decision-dot"></span>
              </span>
              {{ opt.label }}
            </button>
          </div>

          <!-- Feedback after choice -->
          <Transition name="feedback">
            <div
              v-if="getDecisionChoice(currentSlide.screen.id) != null"
              class="feedback-panel"
            >
              <div class="feedback-icon">
                <svg v-if="currentSlide.screen.interaction.options?.[getDecisionChoice(currentSlide.screen.id)!]?.isRecommended" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div class="feedback-content">
                <p class="feedback-text">
                  {{
                    currentSlide.screen.interaction.options?.[
                      getDecisionChoice(currentSlide.screen.id)!
                    ]?.feedback
                  }}
                </p>
                <p
                  v-if="
                    !currentSlide.screen.interaction.options?.[
                      getDecisionChoice(currentSlide.screen.id)!
                    ]?.isRecommended
                  "
                  class="feedback-hint"
                >
                  The recommended choice was:
                  <strong>{{
                    currentSlide.screen.interaction.options?.find(
                      (o) => o.isRecommended
                    )?.label
                  }}</strong>
                </p>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Quiz slide -->
      <div v-else-if="currentSlide.kind === 'quiz'" :key="'q-' + currentIndex" class="slide quiz-slide">
        <h3 class="quiz-title">Knowledge Check: {{ currentSlide.moduleTitle }}</h3>

        <div
          v-for="(q, qi) in currentSlide.questions"
          :key="qi"
          class="quiz-question"
        >
          <p class="question-text">{{ qi + 1 }}. {{ q.question }}</p>
          <div class="choices">
            <button
              v-for="(choice, ci) in q.choices"
              :key="ci"
              class="choice-btn"
              :class="{
                selected: getAnswer(currentSlide.moduleIndex, qi) === ci,
                correct: isRevealed(currentSlide.moduleIndex, qi) && ci === q.answerIndex,
                incorrect:
                  isRevealed(currentSlide.moduleIndex, qi) &&
                  getAnswer(currentSlide.moduleIndex, qi) === ci &&
                  ci !== q.answerIndex,
                revealed: isRevealed(currentSlide.moduleIndex, qi),
              }"
              :disabled="isRevealed(currentSlide.moduleIndex, qi)"
              @click="selectAnswer(currentSlide.moduleIndex, qi, ci)"
            >
              <span class="choice-indicator">
                <!-- Correct: checkmark -->
                <svg v-if="isRevealed(currentSlide.moduleIndex, qi) && ci === q.answerIndex" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <!-- Incorrect: X -->
                <svg v-else-if="isRevealed(currentSlide.moduleIndex, qi) && getAnswer(currentSlide.moduleIndex, qi) === ci && ci !== q.answerIndex" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                <!-- Default: letter -->
                <span v-else>{{ "ABCD"[ci] }}</span>
              </span>
              {{ choice }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Bottom bar: nav + audio -->
    <div class="bottom-bar">
      <button class="nav-btn btn-back" :disabled="isFirst" @click="prev">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      <div class="bar-center">
        <AudioPlayer
          v-if="currentAudioSrc"
          ref="audioRef"
          :src="currentAudioSrc"
          :autoplay="autoPlay"
          bare
        />
        <label class="autoplay-toggle">
          <input type="checkbox" v-model="autoPlay" />
          <span class="toggle-track">
            <span class="toggle-thumb"></span>
          </span>
          Auto-play
        </label>
        <button
          v-if="currentNarration"
          class="transcript-btn"
          :class="{ active: showTranscript }"
          @click="showTranscript = !showTranscript"
          aria-label="Toggle transcript"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Transcript
        </button>
      </div>

      <button
        v-if="!isLast"
        class="nav-btn btn-next"
        @click="next"
      >
        Next
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      <button
        v-else
        class="nav-btn btn-finish"
        @click="store.currentStep = 5"
      >
        Download SCORM
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>

    <!-- Transcript panel -->
    <Transition name="transcript">
      <div v-if="showTranscript && currentNarration" class="transcript-panel">
        <p class="transcript-text">"{{ currentNarration }}"</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.player {
  max-width: 800px;
  margin: 0 auto;
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}

.course-title {
  font-family: var(--font-display);
  font-size: 1.3em;
  color: #fff;
  text-shadow: 0 1px 6px rgba(0, 60, 20, 0.1);
}

.player-meta {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85em;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

/* Progress */
.progress-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin-bottom: 20px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 2px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Module banner */
.module-banner {
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: var(--text-on-glass);
  text-align: center;
  padding: 12px 20px;
  border-radius: var(--radius-sm);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.95em;
  margin-bottom: 16px;
}

.banner-enter-active { animation: fadeUp 0.3s ease; }
.banner-leave-active { animation: fadeUp 0.2s ease reverse; }

/* Slide card */
.slide {
  background: var(--glass);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  padding: 28px;
  min-height: 300px;
  box-shadow: var(--shadow);
}

/* Slide transitions */
.slide-next-enter-active,
.slide-prev-enter-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-next-leave-active,
.slide-prev-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-next-enter-from { opacity: 0; transform: translateX(24px); }
.slide-next-leave-to { opacity: 0; transform: translateX(-12px); }
.slide-prev-enter-from { opacity: 0; transform: translateX(-24px); }
.slide-prev-leave-to { opacity: 0; transform: translateX(12px); }

/* Screen content */
.screen-title {
  font-family: var(--font-display);
  font-size: 1.25em;
  color: var(--text-on-glass);
  margin-bottom: 16px;
}

.screen-image {
  width: 100%;
  max-height: 380px;
  object-fit: contain;
  border-radius: var(--radius-sm);
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.08);
}

.story-text {
  color: var(--text-on-glass-secondary);
  line-height: 1.75;
  padding: 18px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-left: 3px solid var(--accent);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  margin-bottom: 16px;
  font-size: 1.02em;
}

.on-screen-text {
  color: var(--accent);
  font-weight: 600;
  font-size: 1.1em;
  margin-bottom: 16px;
  text-align: center;
}

.narration-fallback {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-sm);
  padding: 14px 18px;
  margin-bottom: 16px;
}

.narration-label {
  font-size: 0.7em;
  text-transform: uppercase;
  color: var(--text-on-glass-secondary);
  font-weight: 700;
  letter-spacing: 0.08em;
}

.narration-text {
  color: var(--text-on-glass-secondary);
  font-style: italic;
  margin-top: 4px;
  line-height: 1.6;
}

/* ── Interaction box (shared for reflection + decision) ── */
.interaction-box {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: var(--radius-sm);
  padding: 20px;
  margin-top: 8px;
}

.interaction-header {
  margin-bottom: 10px;
}

.interaction-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-on-glass);
  font-size: 0.72em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.interaction-prompt {
  color: var(--text-on-glass);
  font-weight: 500;
  font-size: 1.05em;
  line-height: 1.5;
}

/* ── Decision options ── */
.decision-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.decision-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 14px 18px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: var(--text-on-glass);
  font-family: var(--font-body);
  font-size: 0.95em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.decision-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateX(6px);
}

.decision-btn:disabled {
  cursor: default;
}

.decision-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s;
  color: var(--text-on-glass-secondary);
}

.decision-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
}

/* Chosen option */
.decision-btn.chosen {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  font-weight: 600;
}

.decision-btn.chosen .decision-icon {
  background: var(--accent);
  color: #fff;
}

/* Recommended (not the one you picked) */
.decision-btn.recommended:not(.chosen) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}

.decision-btn.recommended:not(.chosen) .decision-icon {
  background: rgba(255, 255, 255, 0.25);
  color: var(--accent);
}

/* Unchosen non-recommended */
.decision-btn.unchosen {
  opacity: 0.35;
}

/* ── Feedback panel ── */
.feedback-panel {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-top: 16px;
  padding: 18px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.feedback-enter-active {
  animation: feedbackIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes feedbackIn {
  from { opacity: 0; transform: translateY(-8px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.feedback-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-on-glass-secondary);
}

.feedback-content {
  flex: 1;
}

.feedback-text {
  color: var(--text-on-glass);
  line-height: 1.6;
  font-size: 0.95em;
}

.feedback-hint {
  color: var(--text-on-glass-secondary);
  font-size: 0.85em;
  margin-top: 8px;
}

.feedback-hint strong {
  color: var(--text-on-glass);
  font-weight: 600;
}

/* ── Quiz ── */
.quiz-slide {
  padding: 32px;
}

.quiz-title {
  font-family: var(--font-display);
  color: var(--text-on-glass);
  font-size: 1.2em;
  margin-bottom: 28px;
  text-align: center;
}

.quiz-question {
  margin-bottom: 28px;
}

.question-text {
  color: var(--text-on-glass);
  font-weight: 600;
  margin-bottom: 14px;
  font-size: 1.05em;
}

.choices {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.choice-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 13px 16px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-on-glass-secondary);
  font-family: var(--font-body);
  font-size: 0.95em;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.choice-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.45);
  color: var(--text-on-glass);
}

.choice-btn:disabled {
  cursor: default;
}

.choice-indicator {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78em;
  font-weight: 700;
  flex-shrink: 0;
  transition: all 0.3s;
  color: var(--text-on-glass-secondary);
}

/* Correct answer */
.choice-btn.correct {
  background: rgba(255, 255, 255, 0.28);
  border-color: rgba(255, 255, 255, 0.45);
  color: var(--text-on-glass);
  font-weight: 600;
}

.choice-btn.correct .choice-indicator {
  background: var(--accent);
  color: #fff;
}

/* Incorrect answer */
.choice-btn.incorrect {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  color: var(--text-on-glass-secondary);
}

.choice-btn.incorrect .choice-indicator {
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-on-glass-secondary);
}

/* Other revealed (not picked, not correct) */
.choice-btn.revealed:not(.correct):not(.incorrect) {
  opacity: 0.4;
}

/* ── Bottom bar (nav + audio) ── */
.bottom-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius);
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 0.85em;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.btn-back {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-on-glass-secondary);
}

.btn-back:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.35);
  color: var(--text-on-glass);
}

.btn-next,
.btn-finish {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 2px 10px rgba(27, 94, 47, 0.2);
}

.btn-next:hover,
.btn-finish:hover {
  box-shadow: 0 4px 16px rgba(27, 94, 47, 0.35);
}

.bar-center {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

/* AudioPlayer fills the available space */
.bar-center :deep(.ap) {
  flex: 1;
  min-width: 0;
}

/* Toggle switch */
.autoplay-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-on-glass-secondary);
  font-size: 0.72em;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  white-space: nowrap;
}

.autoplay-toggle input {
  display: none;
}

.toggle-track {
  width: 28px;
  height: 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  position: relative;
  transition: background 0.3s;
}

.autoplay-toggle input:checked ~ .toggle-track {
  background: rgba(27, 94, 47, 0.45);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.autoplay-toggle input:checked ~ .toggle-track .toggle-thumb {
  transform: translateX(12px);
  background: #fff;
}

/* Transcript button */
.transcript-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: var(--radius-sm, 10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-on-glass-secondary);
  font-family: var(--font-body);
  font-size: 0.72em;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.transcript-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.35);
  color: var(--text-on-glass);
}

.transcript-btn.active {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.35);
  color: var(--text-on-glass);
}

/* Transcript panel */
.transcript-panel {
  margin-top: 10px;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-sm);
}

.transcript-text {
  color: var(--text-on-glass-secondary);
  font-style: italic;
  line-height: 1.65;
  font-size: 0.92em;
}

.transcript-enter-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.transcript-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.transcript-enter-from,
.transcript-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
