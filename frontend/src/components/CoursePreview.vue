<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { useCourseStore } from "../stores/courseStore";
import type { Screen, QuizQuestion } from "../types/course";

const store = useCourseStore();

// Build flat list of slides: screens + quiz pages
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
const audioRef = ref<HTMLAudioElement | null>(null);
const autoPlay = ref(true);

const currentSlide = computed(() => slides.value[currentIndex.value]);
const isFirst = computed(() => currentIndex.value === 0);
const isLast = computed(() => currentIndex.value === slides.value.length - 1);
const progress = computed(
  () => ((currentIndex.value + 1) / slides.value.length) * 100
);

// Decision state per screen
const decisionChoices = ref<Record<string, number | null>>({});

function getDecisionChoice(screenId: string): number | null {
  return decisionChoices.value[screenId] ?? null;
}

function selectDecision(screenId: string, optionIndex: number) {
  if (decisionChoices.value[screenId] != null) return; // already chosen
  decisionChoices.value[screenId] = optionIndex;
}

// Quiz state per module
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
    currentIndex.value--;
  }
}

function next() {
  if (currentIndex.value < slides.value.length - 1) {
    stopAudio();
    currentIndex.value++;
  }
}

function stopAudio() {
  if (audioRef.value) {
    audioRef.value.pause();
    audioRef.value.currentTime = 0;
  }
}

// Auto-play audio when slide changes
watch(currentIndex, async () => {
  await nextTick();
  if (autoPlay.value && audioRef.value) {
    audioRef.value.play().catch(() => {});
  }
});
</script>

<template>
  <div v-if="store.courseData && currentSlide" class="player">
    <!-- Header -->
    <div class="player-header">
      <h2 class="course-title">{{ store.courseData.title }}</h2>
      <div class="player-meta">
        Screen {{ currentIndex + 1 }} of {{ slides.length }}
      </div>
    </div>

    <!-- Progress bar -->
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: progress + '%' }"></div>
    </div>

    <!-- Module banner -->
    <div
      v-if="currentSlide.kind === 'screen' && currentSlide.isModuleStart"
      class="module-banner"
    >
      {{ currentSlide.moduleTitle }}
    </div>

    <!-- Screen slide -->
    <div v-if="currentSlide.kind === 'screen'" class="slide">
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

      <!-- Audio player -->
      <div v-if="currentSlide.screen.audio" class="audio-section">
        <audio
          ref="audioRef"
          :key="currentSlide.screen.id"
          :src="audioUrl(currentSlide.screen.audio.file)"
          controls
          class="audio-player"
        ></audio>
      </div>
      <div v-else-if="currentSlide.screen.narration" class="narration-fallback">
        <span class="narration-label">Narration</span>
        <p class="narration-text">"{{ currentSlide.screen.narration }}"</p>
      </div>

      <!-- Reflection interaction (just a prompt) -->
      <div
        v-if="
          currentSlide.screen.interaction &&
          currentSlide.screen.interaction.type === 'reflection'
        "
        class="interaction"
      >
        <span class="interaction-badge">reflection</span>
        <p class="interaction-prompt">
          {{ currentSlide.screen.interaction.prompt }}
        </p>
      </div>

      <!-- Decision interaction (clickable options with feedback) -->
      <div
        v-if="
          currentSlide.screen.interaction &&
          currentSlide.screen.interaction.type === 'decision'
        "
        class="decision-box"
      >
        <span class="interaction-badge decision-badge">decision point</span>
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
                getDecisionChoice(currentSlide.screen.id) !== oi,
            }"
            :disabled="getDecisionChoice(currentSlide.screen.id) != null"
            @click="selectDecision(currentSlide.screen.id, oi)"
          >
            {{ opt.label }}
          </button>
        </div>

        <!-- Feedback after choice -->
        <div
          v-if="getDecisionChoice(currentSlide.screen.id) != null"
          class="decision-feedback"
          :class="{
            'feedback-good':
              currentSlide.screen.interaction.options?.[
                getDecisionChoice(currentSlide.screen.id)!
              ]?.isRecommended,
            'feedback-warning':
              !currentSlide.screen.interaction.options?.[
                getDecisionChoice(currentSlide.screen.id)!
              ]?.isRecommended,
          }"
        >
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
    </div>

    <!-- Quiz slide -->
    <div v-else-if="currentSlide.kind === 'quiz'" class="slide quiz-slide">
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
            <span class="choice-letter">{{ "ABCD"[ci] }}</span>
            {{ choice }}
          </button>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="nav-bar">
      <button class="nav-btn btn-back" :disabled="isFirst" @click="prev">
        &#8592; Back
      </button>

      <div class="nav-center">
        <label class="autoplay-toggle">
          <input type="checkbox" v-model="autoPlay" />
          Auto-play audio
        </label>
      </div>

      <button
        v-if="!isLast"
        class="nav-btn btn-next"
        @click="next"
      >
        Next &#8594;
      </button>
      <button
        v-else
        class="nav-btn btn-finish"
        @click="store.currentStep = 5"
      >
        Download SCORM &#8594;
      </button>
    </div>
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
  margin-bottom: 8px;
}

.course-title {
  font-size: 1.3em;
  color: #fff;
}

.player-meta {
  color: #888;
  font-size: 0.85em;
}

.progress-track {
  width: 100%;
  height: 4px;
  background: #2a2a4a;
  border-radius: 2px;
  margin-bottom: 20px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #6c63ff;
  border-radius: 2px;
  transition: width 0.4s ease;
}

.module-banner {
  background: #6c63ff;
  color: white;
  text-align: center;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95em;
  margin-bottom: 16px;
}

.slide {
  background: #1a1a2e;
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  padding: 28px;
  min-height: 300px;
}

.screen-title {
  font-size: 1.25em;
  color: #fff;
  margin-bottom: 16px;
}

.screen-image {
  width: 100%;
  max-height: 380px;
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 20px;
  background: #111;
}

.story-text {
  color: #ccc;
  line-height: 1.7;
  padding: 16px;
  background: #15152a;
  border-left: 3px solid #6c63ff;
  border-radius: 0 8px 8px 0;
  margin-bottom: 16px;
  font-size: 1.05em;
}

.on-screen-text {
  color: #6c63ff;
  font-weight: 600;
  font-size: 1.1em;
  margin-bottom: 16px;
  text-align: center;
}

.audio-section {
  margin-bottom: 16px;
}

.audio-player {
  width: 100%;
  height: 40px;
  border-radius: 8px;
}

.narration-fallback {
  background: #15152a;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 16px;
}

.narration-label {
  font-size: 0.7em;
  text-transform: uppercase;
  color: #555;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.narration-text {
  color: #999;
  font-style: italic;
  margin-top: 4px;
  line-height: 1.5;
}

.interaction {
  background: #2a2a1a;
  border: 1px solid #4a4a2a;
  border-radius: 8px;
  padding: 16px;
}

.interaction-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  background: #3a3a2a;
  color: #ffc107;
  font-size: 0.75em;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.interaction-prompt {
  color: #ddd;
  font-weight: 500;
  font-size: 1.05em;
}

/* Decision interaction */
.decision-box {
  background: #1a1a2e;
  border: 2px solid #6c63ff;
  border-radius: 10px;
  padding: 20px;
}

.decision-badge {
  background: #3a2a5a;
  color: #b39dff;
}

.decision-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.decision-btn {
  width: 100%;
  text-align: left;
  padding: 14px 18px;
  border: 2px solid #3a3a5a;
  border-radius: 8px;
  background: #15152a;
  color: #ddd;
  font-size: 0.95em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s;
}

.decision-btn:hover:not(:disabled) {
  border-color: #6c63ff;
  background: #1e1e3e;
  transform: translateX(4px);
}

.decision-btn:disabled {
  cursor: default;
}

.decision-btn.chosen {
  border-color: #6c63ff;
  background: #252550;
  color: #fff;
}

.decision-btn.recommended:not(.chosen) {
  border-color: #4caf50;
  background: #1a2e1a;
  color: #4caf50;
}

.decision-btn.unchosen:not(.recommended) {
  opacity: 0.4;
}

.decision-feedback {
  margin-top: 16px;
  padding: 16px;
  border-radius: 8px;
  animation: fadeSlideIn 0.4s ease;
}

.feedback-good {
  background: #1a2e1a;
  border: 1px solid #2d5a2d;
}

.feedback-warning {
  background: #2e2a1a;
  border: 1px solid #5a4a2d;
}

.feedback-text {
  color: #ddd;
  line-height: 1.5;
  font-size: 0.95em;
}

.feedback-good .feedback-text {
  color: #81c784;
}

.feedback-warning .feedback-text {
  color: #ffcc80;
}

.feedback-hint {
  color: #888;
  font-size: 0.85em;
  margin-top: 8px;
}

.feedback-hint strong {
  color: #4caf50;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Quiz */
.quiz-slide {
  padding: 32px;
}

.quiz-title {
  color: #fff;
  font-size: 1.2em;
  margin-bottom: 24px;
  text-align: center;
}

.quiz-question {
  margin-bottom: 24px;
}

.question-text {
  color: #ddd;
  font-weight: 600;
  margin-bottom: 12px;
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
  padding: 12px 16px;
  border: 2px solid #2a2a4a;
  border-radius: 8px;
  background: #15152a;
  color: #ccc;
  font-size: 0.95em;
  cursor: pointer;
  transition: all 0.2s;
}

.choice-btn:hover:not(:disabled) {
  border-color: #6c63ff;
  background: #1e1e3e;
}

.choice-btn:disabled {
  cursor: default;
}

.choice-btn.correct {
  border-color: #4caf50;
  background: #1a2e1a;
  color: #4caf50;
}

.choice-btn.incorrect {
  border-color: #f44336;
  background: #2e1a1a;
  color: #f44336;
}

.choice-btn.revealed:not(.correct):not(.incorrect) {
  opacity: 0.5;
}

.choice-letter {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #252540;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8em;
  font-weight: 700;
  flex-shrink: 0;
}

.choice-btn.correct .choice-letter {
  background: #2d5a2d;
}

.choice-btn.incorrect .choice-letter {
  background: #5a2d2d;
}

/* Navigation */
.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 16px 0;
}

.nav-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 0.95em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-back {
  background: #2a2a4a;
  color: #aaa;
}

.btn-back:hover:not(:disabled) {
  background: #353560;
}

.btn-next {
  background: #6c63ff;
  color: white;
}

.btn-next:hover {
  background: #5a52e0;
}

.btn-finish {
  background: #4caf50;
  color: white;
}

.btn-finish:hover {
  background: #43a047;
}

.nav-center {
  display: flex;
  align-items: center;
}

.autoplay-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 0.8em;
  cursor: pointer;
  user-select: none;
}

.autoplay-toggle input {
  accent-color: #6c63ff;
}
</style>
