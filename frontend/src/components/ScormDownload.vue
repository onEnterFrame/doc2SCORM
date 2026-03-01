<script setup lang="ts">
import { useCourseStore } from "../stores/courseStore";

const store = useCourseStore();

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function download() {
  window.open(store.downloadUrl, "_blank");
}

function startOver() {
  store.reset();
}
</script>

<template>
  <div class="download-container">
    <div class="download-card">
      <div class="success-icon">&#10003;</div>
      <h2>Your SCORM Package is Ready</h2>

      <div v-if="store.courseData" class="course-summary">
        <h3>{{ store.courseData.title }}</h3>
        <div class="summary-stats">
          <div class="stat">
            <span class="stat-value">{{ store.courseData.modules.length }}</span>
            <span class="stat-label">Modules</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{
              store.courseData.modules.reduce(
                (sum, m) => sum + m.screens.length,
                0
              )
            }}</span>
            <span class="stat-label">Screens</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{
              store.courseData.modules.reduce(
                (sum, m) => sum + m.quiz.length,
                0
              )
            }}</span>
            <span class="stat-label">Quiz Questions</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ formatSize(store.scormSizeBytes) }}</span>
            <span class="stat-label">Package Size</span>
          </div>
        </div>
      </div>

      <div class="download-actions">
        <button class="btn btn-primary btn-large" @click="download">
          Download SCORM 1.2 Package
        </button>
        <button class="btn btn-secondary" @click="store.currentStep = 4">
          Back to Preview
        </button>
        <button class="btn btn-ghost" @click="startOver">
          Start Over
        </button>
      </div>

      <p class="scorm-note">
        Upload this ZIP file to your LMS (Moodle, SCORM Cloud, etc.) to deploy the course.
      </p>
    </div>
  </div>
</template>

<style scoped>
.download-container {
  display: flex;
  justify-content: center;
}

.download-card {
  max-width: 560px;
  width: 100%;
  background: #1a1a2e;
  border: 1px solid #2a2a4a;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
}

.success-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #1e3a1e;
  color: #4caf50;
  font-size: 2em;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.download-card h2 {
  color: #fff;
  font-size: 1.4em;
  margin-bottom: 24px;
}

.course-summary {
  background: #15152a;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 28px;
}

.course-summary h3 {
  color: #6c63ff;
  font-size: 1.1em;
  margin-bottom: 16px;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.4em;
  font-weight: 700;
  color: #fff;
}

.stat-label {
  font-size: 0.75em;
  color: #888;
  margin-top: 2px;
}

.download-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.btn {
  padding: 12px 32px;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-large {
  padding: 16px 32px;
  font-size: 1.1em;
}

.btn-primary {
  background: #6c63ff;
  color: white;
}

.btn-primary:hover {
  background: #5a52e0;
}

.btn-secondary {
  background: #2a2a4a;
  color: #aaa;
}

.btn-secondary:hover {
  background: #353560;
}

.btn-ghost {
  background: transparent;
  color: #666;
  border: 1px solid #333;
}

.btn-ghost:hover {
  color: #aaa;
  border-color: #555;
}

.scorm-note {
  color: #666;
  font-size: 0.8em;
}
</style>
