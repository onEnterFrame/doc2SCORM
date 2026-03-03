<script setup lang="ts">
import { useCourseStore } from "../stores/courseStore";

import { ref } from "vue";

const store = useCourseStore();
const publishError = ref("");
const copySuccess = ref(false);

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

async function publish() {
  publishError.value = "";
  try {
    await store.publishCourse();
  } catch (error) {
    publishError.value =
      error instanceof Error ? error.message : "Publish failed";
  }
}

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(store.publicUrl);
    copySuccess.value = true;
    setTimeout(() => (copySuccess.value = false), 2000);
  } catch {
    // fallback: select the input text
  }
}
</script>

<template>
  <div class="download-container">
    <div class="download-card">
      <div class="success-icon">
        <div class="success-ring"></div>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>

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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
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

      <div class="publish-divider"></div>

      <div class="publish-section">
        <h3 class="publish-heading">Share Your Course</h3>

        <template v-if="!store.isPublished">
          <p class="publish-description">
            Publish to the public gallery so anyone can experience your course — no LMS required.
          </p>
          <button
            class="btn btn-primary"
            :disabled="store.isPublishing"
            @click="publish"
          >
            <svg v-if="!store.isPublishing" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <svg v-else class="spinner-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            {{ store.isPublishing ? "Publishing..." : "Make Public" }}
          </button>
          <p v-if="publishError" class="publish-error">{{ publishError }}</p>
        </template>

        <template v-else>
          <div class="publish-success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Published to the gallery</span>
          </div>
          <div class="publish-url-row">
            <input
              type="text"
              class="publish-url-input"
              :value="store.publicUrl"
              readonly
              @focus="($event.target as HTMLInputElement).select()"
            />
            <button class="btn btn-secondary btn-copy" @click="copyUrl">
              {{ copySuccess ? "Copied!" : "Copy" }}
            </button>
          </div>
          <a
            :href="store.publicUrl"
            target="_blank"
            rel="noopener"
            class="btn btn-ghost open-link"
          >
            Open Published Course
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.download-container {
  display: flex;
  justify-content: center;
  animation: fadeUp 0.5s ease;
}

.download-card {
  max-width: 560px;
  width: 100%;
  background: var(--glass);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  padding: 44px 40px;
  text-align: center;
  box-shadow: var(--shadow-lg);
}

.success-icon {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  animation: checkPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
}

.success-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--accent) 25%, transparent);
  animation: ringExpand 0.8s ease 0.3s both;
}

@keyframes checkPop {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes ringExpand {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.download-card h2 {
  font-family: var(--font-display);
  color: var(--text-on-glass);
  font-size: 1.5em;
  margin-bottom: 28px;
}

.course-summary {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-sm);
  padding: 22px;
  margin-bottom: 32px;
}

.course-summary h3 {
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 1.1em;
  margin-bottom: 18px;
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
  font-family: var(--font-display);
  font-size: 1.5em;
  font-weight: 700;
  color: var(--text-on-glass);
}

.stat-label {
  font-size: 0.72em;
  color: var(--text-on-glass-secondary);
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
}

.download-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}

.btn-large {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 32px;
  font-size: 1.05em;
}

.scorm-note {
  color: var(--text-on-glass-secondary);
  font-size: 0.8em;
}

.publish-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
  margin: 28px 0;
}

.publish-section {
  text-align: center;
}

.publish-heading {
  font-family: var(--font-display);
  color: var(--text-on-glass);
  font-size: 1.15em;
  margin-bottom: 12px;
}

.publish-description {
  color: var(--text-on-glass-secondary);
  font-size: 0.88em;
  margin-bottom: 16px;
  line-height: 1.5;
}

.publish-error {
  color: var(--red);
  font-size: 0.85em;
  margin-top: 10px;
}

.spinner-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.publish-success {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--accent);
  font-weight: 600;
  margin-bottom: 14px;
}

.publish-url-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.publish-url-input {
  flex: 1;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-on-glass);
  font-family: monospace;
  font-size: 0.78em;
  outline: none;
}

.publish-url-input:focus {
  border-color: var(--accent);
}

.btn-copy {
  padding: 10px 18px;
  white-space: nowrap;
}

.open-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  font-size: 0.9em;
}
</style>
