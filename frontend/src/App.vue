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
      <FileUpload v-if="store.currentStep === 1" />
      <StoryPicker v-else-if="store.currentStep === 2" />
      <GenerationProgress v-else-if="store.currentStep === 3" />
      <CoursePreview v-else-if="store.currentStep === 4" />
      <ScormDownload v-else-if="store.currentStep === 5" />
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

body {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    sans-serif;
  background: #0f0f1a;
  color: #e0e0e0;
  min-height: 100vh;
}

.app {
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
}

.logo {
  font-size: 2em;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.02em;
}

.logo-accent {
  color: #6c63ff;
}

.subtitle {
  color: #888;
  font-size: 0.95em;
  margin-top: 4px;
}

.steps {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 40px;
}

.step {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 24px;
  background: #1a1a2e;
  font-size: 0.85em;
  color: #666;
  transition: all 0.3s;
}

.step.active {
  background: #6c63ff;
  color: white;
}

.step.completed {
  background: #1e3a1e;
  color: #4caf50;
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
  background: rgba(255, 255, 255, 0.1);
}

.step.active .step-dot {
  background: rgba(255, 255, 255, 0.2);
}

.step.completed .step-dot {
  background: rgba(76, 175, 80, 0.3);
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
  color: #444;
  font-size: 0.8em;
}
</style>
