<script setup lang="ts">
import { ref } from "vue";
import { useCourseStore } from "../stores/courseStore";
import api from "../api/client";

const store = useCourseStore();
const isDragging = ref(false);
const isUploading = ref(false);
const error = ref("");

const acceptedTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/markdown",
  "text/plain",
];

function onDragOver(e: DragEvent) {
  e.preventDefault();
  isDragging.value = true;
}

function onDragLeave() {
  isDragging.value = false;
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;
  const file = e.dataTransfer?.files[0];
  if (file) handleFile(file);
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) handleFile(file);
}

async function handleFile(file: File) {
  if (!acceptedTypes.includes(file.type) && !file.name.endsWith(".md")) {
    error.value = "Unsupported file type. Please upload PDF, DOCX, MD, or TXT.";
    return;
  }

  error.value = "";
  store.selectedDirection = null;
  store.courseData = null;
  store.generationStatus = "idle";
  store.scormReady = false;
  isUploading.value = true;
  store.fileName = file.name;

  try {
    const formData = new FormData();
    formData.append("document", file);

    const uploadRes = await api.post("/api/upload", formData);
    store.sessionId = uploadRes.data.sessionId;
    store.extractedText = uploadRes.data.extractedText;
    store.wordCount = uploadRes.data.wordCount;

    const suggestRes = await api.post("/api/suggest-directions", {
      sessionId: store.sessionId,
      extractedText: store.extractedText,
    });

    store.suggestions = suggestRes.data.suggestions;
    store.currentStep = 2;
  } catch (err: any) {
    error.value =
      err.response?.data?.message || err.message || "Upload failed";
  } finally {
    isUploading.value = false;
  }
}
</script>

<template>
  <div class="upload-container">
    <div
      class="drop-zone"
      :class="{ dragging: isDragging, uploading: isUploading }"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @click="($refs.fileInput as HTMLInputElement).click()"
    >
      <div v-if="isUploading" class="upload-progress">
        <div class="spinner"></div>
        <p class="upload-status">Analyzing <strong>{{ store.fileName }}</strong>...</p>
        <p class="upload-hint">Extracting text and generating story directions</p>
      </div>
      <div v-else class="upload-prompt">
        <div class="upload-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <polyline points="9 15 12 12 15 15"/>
          </svg>
        </div>
        <p class="upload-title">Drop your document here</p>
        <p class="upload-hint">or click to browse</p>
        <div class="file-types">
          <span class="file-type">PDF</span>
          <span class="file-type">DOCX</span>
          <span class="file-type">MD</span>
          <span class="file-type">TXT</span>
        </div>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept=".pdf,.docx,.md,.txt"
      style="display: none"
      @change="onFileSelect"
    />

    <Transition name="error-fade">
      <p v-if="error" class="error">{{ error }}</p>
    </Transition>
  </div>
</template>

<style scoped>
.upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.drop-zone {
  width: 100%;
  max-width: 600px;
  min-height: 300px;
  border: 2px dashed rgba(255, 255, 255, 0.4);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--glass);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
}

.drop-zone:hover,
.drop-zone.dragging {
  border-color: rgba(255, 255, 255, 0.7);
  background: var(--glass-hover);
  box-shadow: 0 8px 32px rgba(0, 60, 20, 0.12);
  transform: translateY(-2px);
}

.drop-zone.uploading {
  cursor: default;
  border-color: rgba(255, 255, 255, 0.5);
  border-style: solid;
  transform: none;
}

.upload-prompt,
.upload-progress {
  text-align: center;
  padding: 40px;
}

.upload-icon {
  color: var(--text-on-glass);
  margin-bottom: 16px;
  opacity: 0.5;
}

.upload-title {
  font-family: var(--font-display);
  font-size: 1.3em;
  font-weight: 600;
  color: var(--text-on-glass);
  margin-bottom: 6px;
}

.upload-hint {
  color: var(--text-on-glass-secondary);
  font-size: 0.9em;
}

.file-types {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 20px;
}

.file-type {
  padding: 5px 14px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: var(--text-on-glass);
  font-size: 0.78em;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--text-on-glass);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.upload-status {
  color: var(--text-on-glass);
  font-size: 1em;
  margin-bottom: 4px;
}

.upload-status strong {
  font-weight: 700;
}

.error {
  color: #b71c1c;
  margin-top: 16px;
  font-size: 0.9em;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid rgba(183, 28, 28, 0.2);
  border-radius: var(--radius-sm);
}

.error-fade-enter-active { animation: fadeUp 0.3s ease; }
.error-fade-leave-active { animation: fadeUp 0.2s ease reverse; }
</style>
