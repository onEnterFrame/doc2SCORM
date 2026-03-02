<script setup lang="ts">
import { useCourseStore } from "./stores/courseStore";
import FileUpload from "./components/FileUpload.vue";
import StoryPicker from "./components/StoryPicker.vue";
import GenerationProgress from "./components/GenerationProgress.vue";
import CoursePreview from "./components/CoursePreview.vue";
import ScormDownload from "./components/ScormDownload.vue";

const store = useCourseStore();

const steps = [
  { num: 1, label: "Upload" },
  { num: 2, label: "Story Direction" },
  { num: 3, label: "Generate" },
  { num: 4, label: "Preview" },
  { num: 5, label: "Download" },
];
</script>

<template>
  <div class="app">
    <!-- Ambient background orbs -->
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>
    <div class="bg-orb bg-orb-3"></div>

    <header class="header">
      <h1 class="logo">Doc2SCORM <span class="logo-accent">Director</span></h1>
      <p class="subtitle">AI Creative Director for Story-Driven Learning</p>
    </header>

    <nav class="steps">
      <div
        v-for="step in steps"
        :key="step.num"
        class="step"
        :class="{
          active: store.currentStep === step.num,
          completed: store.currentStep > step.num,
        }"
      >
        <div class="step-dot">
          <span v-if="store.currentStep > step.num">&#10003;</span>
          <span v-else>{{ step.num }}</span>
        </div>
        <span class="step-label">{{ step.label }}</span>
      </div>
    </nav>

    <main class="main">
      <Transition name="page" mode="out-in">
        <FileUpload v-if="store.currentStep === 1" key="upload" />
        <StoryPicker v-else-if="store.currentStep === 2" key="picker" />
        <GenerationProgress v-else-if="store.currentStep === 3" key="progress" />
        <CoursePreview v-else-if="store.currentStep === 4" key="preview" />
        <ScormDownload v-else-if="store.currentStep === 5" key="download" />
      </Transition>
    </main>

    <footer class="footer">
      <p>Powered by Gemini &middot; Story-Driven Learning</p>
    </footer>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Register custom properties as <color> so the browser can interpolate them */
@property --gradient-start {
  syntax: '<color>';
  inherits: true;
  initial-value: #6abf78;
}
@property --gradient-end {
  syntax: '<color>';
  inherits: true;
  initial-value: #7acc8e;
}
@property --accent {
  syntax: '<color>';
  inherits: true;
  initial-value: #1b5e2f;
}
@property --text-on-glass {
  syntax: '<color>';
  inherits: true;
  initial-value: #1a3a2a;
}
@property --text-on-glass-secondary {
  syntax: '<color>';
  inherits: true;
  initial-value: rgba(26, 58, 42, 0.7);
}
@property --orb-1 {
  syntax: '<color>';
  inherits: true;
  initial-value: rgba(142, 216, 154, 0.4);
}
@property --orb-2 {
  syntax: '<color>';
  inherits: true;
  initial-value: rgba(56, 142, 80, 0.25);
}
@property --orb-3 {
  syntax: '<color>';
  inherits: true;
  initial-value: rgba(180, 230, 170, 0.3);
}

:root {
  --gradient-start: #6abf78;
  --gradient-end: #7acc8e;
  --glass: rgba(255, 255, 255, 0.22);
  --glass-hover: rgba(255, 255, 255, 0.32);
  --glass-border: rgba(255, 255, 255, 0.35);
  --glass-border-hover: rgba(255, 255, 255, 0.5);
  --glass-strong: rgba(255, 255, 255, 0.35);
  --accent: #1b5e2f;
  --accent-light: #fff;
  --accent-glow: rgba(255, 255, 255, 0.3);
  --green-deep: #1b5e2f;
  --green-success: #e8f5e9;
  --red: #c62828;
  --red-dim: rgba(198, 40, 40, 0.15);
  --amber: #e65100;
  --amber-dim: rgba(230, 81, 0, 0.12);
  --text: #fff;
  --text-secondary: rgba(255, 255, 255, 0.85);
  --text-muted: rgba(255, 255, 255, 0.7);
  --text-dim: rgba(255, 255, 255, 0.5);
  --text-on-glass: #1a3a2a;
  --text-on-glass-secondary: rgba(26, 58, 42, 0.7);
  --orb-1: rgba(142, 216, 154, 0.4);
  --orb-2: rgba(56, 142, 80, 0.25);
  --orb-3: rgba(180, 230, 170, 0.3);
  --font-body: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-display: "Space Grotesk", "Inter", sans-serif;
  --blur: blur(20px);
  --radius: 18px;
  --radius-sm: 12px;
  --radius-pill: 100px;
  --shadow: 0 8px 32px rgba(0, 60, 20, 0.12);
  --shadow-lg: 0 16px 48px rgba(0, 60, 20, 0.18);
  transition:
    --gradient-start 1.2s ease,
    --gradient-end 1.2s ease,
    --accent 1.2s ease,
    --text-on-glass 1.2s ease,
    --text-on-glass-secondary 1.2s ease,
    --orb-1 1.2s ease,
    --orb-2 1.2s ease,
    --orb-3 1.2s ease;
}

body {
  font-family: var(--font-body);
  background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
}

/* Ambient floating orbs for depth */
.bg-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
  animation: orbFloat 20s ease-in-out infinite;
}

.bg-orb-1 {
  width: 600px;
  height: 600px;
  background: var(--orb-1, rgba(142, 216, 154, 0.4));
  top: -150px;
  left: -100px;
}

.bg-orb-2 {
  width: 500px;
  height: 500px;
  background: var(--orb-2, rgba(56, 142, 80, 0.25));
  bottom: -120px;
  right: -80px;
  animation-delay: -7s;
  animation-duration: 25s;
}

.bg-orb-3 {
  width: 350px;
  height: 350px;
  background: var(--orb-3, rgba(180, 230, 170, 0.3));
  top: 40%;
  left: 55%;
  animation-delay: -14s;
  animation-duration: 30s;
}

@keyframes orbFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.05); }
  66% { transform: translate(-20px, 15px) scale(0.95); }
}

.app {
  position: relative;
  z-index: 1;
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  text-align: center;
  margin-bottom: 32px;
  animation: fadeDown 0.6s ease;
}

.logo {
  font-family: var(--font-display);
  font-size: 2.2em;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.03em;
  text-shadow: 0 2px 12px rgba(0, 60, 20, 0.15);
}

.logo-accent {
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}

.subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95em;
  margin-top: 6px;
}

/* Steps nav */
.steps {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 40px;
  animation: fadeDown 0.6s ease 0.1s both;
}

.step {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 0.85em;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.step.active {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.5);
  color: var(--text-on-glass);
  box-shadow: 0 4px 16px rgba(0, 60, 20, 0.1);
}

.step.completed {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
  color: var(--text-on-glass);
}

.step-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75em;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.15);
  transition: all 0.3s;
}

.step.active .step-dot {
  background: var(--accent);
  color: #fff;
}

.step.completed .step-dot {
  background: var(--accent);
  color: #fff;
}

.step-label {
  font-weight: 500;
}

.main {
  flex: 1;
}

.footer {
  text-align: center;
  padding: 24px 0 0;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.8em;
}

/* Page transitions */
.page-enter-active {
  animation: fadeUp 0.4s ease;
}
.page-leave-active {
  animation: fadeUp 0.25s ease reverse;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeDown {
  from { opacity: 0; transform: translateY(-12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Shared button styles */
.btn {
  padding: 12px 28px;
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 0.95em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.btn-primary {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--accent) 25%, transparent);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px color-mix(in srgb, var(--accent) 35%, transparent);
  background: color-mix(in srgb, var(--accent) 85%, black);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: var(--text-on-glass);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.45);
}

.btn-ghost {
  background: transparent;
  color: var(--text-on-glass-secondary);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.btn-ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.35);
  color: var(--text-on-glass);
}
</style>
