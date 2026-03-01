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
  isUploading.value = true;
  store.fileName = file.name;

  try {
    // Upload and extract text
    const formData = new FormData();
    formData.append("document", file);

    const uploadRes = await api.post("/api/upload", formData);
    store.sessionId = uploadRes.data.sessionId;
    store.extractedText = uploadRes.data.extractedText;
    store.wordCount = uploadRes.data.wordCount;

    // Get story suggestions
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
        <div class="upload-icon">&#128196;</div>
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

    <p v-if="error" class="error">{{ error }}</p>
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
  min-height: 280px;
  border: 2px dashed #333;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #1a1a2e;
}

.drop-zone:hover,
.drop-zone.dragging {
  border-color: #6c63ff;
  background: #1a1a3e;
}

.drop-zone.uploading {
  cursor: default;
  border-color: #6c63ff;
  border-style: solid;
}

.upload-prompt,
.upload-progress {
  text-align: center;
  padding: 40px;
}

.upload-icon {
  font-size: 3em;
  margin-bottom: 12px;
}

.upload-title {
  font-size: 1.2em;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.upload-hint {
  color: #888;
  font-size: 0.9em;
}

.file-types {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 16px;
}

.file-type {
  padding: 4px 12px;
  border-radius: 12px;
  background: #252540;
  color: #aaa;
  font-size: 0.8em;
  font-weight: 500;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #333;
  border-top-color: #6c63ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.upload-status {
  color: #fff;
  font-size: 1em;
  margin-bottom: 4px;
}

.error {
  color: #ff6b6b;
  margin-top: 16px;
  font-size: 0.9em;
}
</style>
