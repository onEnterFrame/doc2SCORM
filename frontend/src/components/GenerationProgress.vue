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
    // Step 1: Generate course
    store.generationStatus = "generating-course";
    const courseRes = await api.post("/api/generate-course", {
      sessionId: store.sessionId,
      extractedText: store.extractedText,
      direction: store.selectedDirection,
    });
    store.courseData = courseRes.data.course;

    // Step 2: Generate audio
    store.generationStatus = "generating-audio";
    await api.post("/api/generate-audio", {
      sessionId: store.sessionId,
    });

    // Re-fetch course data with audio references
    const refreshed = await api.get(`/api/course/${store.sessionId}`);
    store.courseData = refreshed.data.course;

    // Step 3: Build SCORM
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
        v-for="stage in stages"
        :key="stage.key"
        class="stage"
        :class="stageStatus(stage.key)"
      >
        <div class="stage-indicator">
          <div v-if="stageStatus(stage.key) === 'active'" class="spinner-small"></div>
          <span v-else-if="stageStatus(stage.key) === 'done'" class="check">&#10003;</span>
          <span v-else-if="stageStatus(stage.key) === 'error'" class="cross">&#10007;</span>
          <span v-else class="dot"></span>
        </div>
        <div class="stage-content">
          <p class="stage-label">{{ stage.label }}</p>
          <p class="stage-description">{{ stage.description }}</p>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-box">
      <p class="error-text">{{ error }}</p>
      <button class="btn btn-primary" @click="runGeneration">Retry</button>
    </div>
  </div>
</template>

<style scoped>
.progress-container {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.progress-title {
  font-size: 1.5em;
  color: #fff;
  margin-bottom: 8px;
}

.progress-subtitle {
  color: #888;
  margin-bottom: 40px;
}

.stages {
  display: flex;
  flex-direction: column;
  gap: 24px;
  text-align: left;
}

.stage {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 20px;
  border-radius: 12px;
  background: #1a1a2e;
  border: 1px solid #2a2a4a;
  transition: all 0.3s;
}

.stage.active {
  border-color: #6c63ff;
  background: #1e1e3e;
}

.stage.done {
  border-color: #2d5a2d;
  background: #1a2a1a;
}

.stage.error {
  border-color: #5a2d2d;
  background: #2a1a1a;
}

.stage-indicator {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.spinner-small {
  width: 24px;
  height: 24px;
  border: 3px solid #333;
  border-top-color: #6c63ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.check {
  color: #4caf50;
  font-size: 1.2em;
  font-weight: bold;
}

.cross {
  color: #ff6b6b;
  font-size: 1.2em;
  font-weight: bold;
}

.dot {
  width: 10px;
  height: 10px;
  background: #444;
  border-radius: 50%;
  display: inline-block;
}

.stage-label {
  color: #fff;
  font-weight: 600;
  margin-bottom: 4px;
}

.stage-description {
  color: #888;
  font-size: 0.85em;
}

.stage.done .stage-label {
  color: #4caf50;
}

.error-box {
  margin-top: 24px;
  padding: 20px;
  background: #2a1a1a;
  border: 1px solid #5a2d2d;
  border-radius: 12px;
}

.error-text {
  color: #ff6b6b;
  margin-bottom: 12px;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 0.95em;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: #6c63ff;
  color: white;
}
</style>
