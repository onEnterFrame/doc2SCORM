<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useCourseStore } from "../stores/courseStore";
import api from "../api/client";

const store = useCourseStore();
const error = ref("");

const stages = [
  {
    key: "generating-course",
    label: "Generating story and illustrations",
    description: "Gemini is creating your course with interleaved visuals...",
  },
  {
    key: "generating-audio",
    label: "Creating narration audio",
    description: "Generating professional narration for each screen...",
  },
  {
    key: "building-scorm",
    label: "Building SCORM package",
    description: "Assembling your downloadable course package...",
  },
];

function stageStatus(key: string) {
  const order = stages.map((s) => s.key);
  const currentIdx = order.indexOf(store.generationStatus);
  const stageIdx = order.indexOf(key);

  if (store.generationStatus === "complete") return "done";
  if (store.generationStatus === "error") {
    if (stageIdx < currentIdx) return "done";
    if (stageIdx === currentIdx) return "error";
    return "pending";
  }
  if (stageIdx < currentIdx) return "done";
  if (stageIdx === currentIdx) return "active";
  return "pending";
}

async function runGeneration() {
  error.value = "";

  try {
    store.generationStatus = "generating-course";
    const courseRes = await api.post("/api/generate-course", {
      sessionId: store.sessionId,
      extractedText: store.extractedText,
      direction: store.selectedDirection,
    });
    store.courseData = courseRes.data.course;
    if (store.courseData?.theme) {
      store.applyTheme(store.courseData.theme);
    }

    store.generationStatus = "generating-audio";
    await api.post("/api/generate-audio", {
      sessionId: store.sessionId,
    });

    const refreshed = await api.get(`/api/course/${store.sessionId}`);
    store.courseData = refreshed.data.course;

    store.generationStatus = "building-scorm";
    const scormRes = await api.post("/api/build-scorm", {
      sessionId: store.sessionId,
    });

    store.downloadUrl = scormRes.data.downloadUrl;
    store.scormSizeBytes = scormRes.data.sizeBytes;
    store.scormReady = true;
    store.generationStatus = "complete";
    store.currentStep = 4;
  } catch (err: any) {
    store.generationStatus = "error";
    error.value =
      err.response?.data?.message || err.message || "Generation failed";
  }
}

onMounted(() => {
  runGeneration();
});
</script>

<template>
  <div class="progress-container">
    <h2 class="progress-title">Creating Your Course</h2>
    <p class="progress-subtitle">
      "{{ store.selectedDirection?.title }}" is being brought to life...
    </p>

    <div class="stages">
      <div
        v-for="(stage, idx) in stages"
        :key="stage.key"
        class="stage"
        :class="stageStatus(stage.key)"
        :style="{ animationDelay: (idx * 0.12) + 's' }"
      >
        <div class="stage-indicator">
          <div v-if="stageStatus(stage.key) === 'active'" class="spinner-ring"></div>
          <span v-else-if="stageStatus(stage.key) === 'done'" class="check-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </span>
          <span v-else-if="stageStatus(stage.key) === 'error'" class="error-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </span>
          <span v-else class="pending-dot"></span>
        </div>
        <div class="stage-content">
          <p class="stage-label">{{ stage.label }}</p>
          <p class="stage-description">{{ stage.description }}</p>
        </div>
      </div>
    </div>

    <Transition name="error-slide">
      <div v-if="error" class="error-box">
        <p class="error-text">{{ error }}</p>
        <button class="btn btn-primary" @click="runGeneration">Retry</button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.progress-container {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.progress-title {
  font-family: var(--font-display);
  font-size: 1.6em;
  color: #fff;
  margin-bottom: 8px;
  text-shadow: 0 2px 8px rgba(0, 60, 20, 0.12);
}

.progress-subtitle {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 40px;
}

.stages {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}

.stage {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 20px;
  border-radius: var(--radius);
  background: var(--glass);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid var(--glass-border);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  animation: stageIn 0.4s ease both;
}

@keyframes stageIn {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
}

.stage.active {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 20px rgba(0, 60, 20, 0.1);
}

.stage.done {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.45);
}

.stage.error {
  background: rgba(255, 200, 200, 0.25);
  border-color: rgba(198, 40, 40, 0.25);
}

.stage-indicator {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.spinner-ring {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(27, 94, 47, 0.2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.check-icon {
  color: var(--accent);
  display: flex;
  animation: checkPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes checkPop {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.error-icon {
  color: var(--red);
  display: flex;
}

.pending-dot {
  width: 10px;
  height: 10px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: inline-block;
}

.stage-label {
  color: var(--text-on-glass);
  font-weight: 600;
  margin-bottom: 4px;
}

.stage-description {
  color: var(--text-on-glass-secondary);
  font-size: 0.85em;
}

.stage.done .stage-label {
  color: var(--accent);
}

.stage.error .stage-label {
  color: var(--red);
}

.error-box {
  margin-top: 28px;
  padding: 24px;
  background: rgba(255, 200, 200, 0.3);
  border: 1px solid rgba(198, 40, 40, 0.2);
  border-radius: var(--radius);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
}

.error-text {
  color: #b71c1c;
  margin-bottom: 14px;
  font-size: 0.95em;
}

.error-slide-enter-active { animation: fadeUp 0.3s ease; }
.error-slide-leave-active { animation: fadeUp 0.2s ease reverse; }
</style>
