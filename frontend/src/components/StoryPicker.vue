<script setup lang="ts">
import { useCourseStore } from "../stores/courseStore";
import type { StorySuggestion } from "../types/course";

const store = useCourseStore();

function selectDirection(suggestion: StorySuggestion) {
  store.selectedDirection = suggestion;
}

function proceed() {
  if (store.selectedDirection) {
    store.currentStep = 3;
  }
}
</script>

<template>
  <div class="picker-container">
    <div class="picker-header">
      <h2>Choose Your Story Direction</h2>
      <p class="picker-subtitle">
        Based on <strong>{{ store.fileName }}</strong> ({{ store.wordCount.toLocaleString() }} words),
        here are three creative approaches:
      </p>
    </div>

    <div class="suggestions-grid">
      <div
        v-for="suggestion in store.suggestions"
        :key="suggestion.id"
        class="suggestion-card"
        :class="{ selected: store.selectedDirection?.id === suggestion.id }"
        @click="selectDirection(suggestion)"
      >
        <h3 class="suggestion-title">{{ suggestion.title }}</h3>
        <p class="suggestion-description">{{ suggestion.description }}</p>
        <span class="suggestion-tone">{{ suggestion.tone }}</span>
      </div>
    </div>

    <div class="actions">
      <button class="btn btn-secondary" @click="store.currentStep = 1">
        Back
      </button>
      <button
        class="btn btn-primary"
        :disabled="!store.selectedDirection"
        @click="proceed"
      >
        Generate Course
      </button>
    </div>
  </div>
</template>

<style scoped>
.picker-container {
  max-width: 800px;
  margin: 0 auto;
}

.picker-header {
  text-align: center;
  margin-bottom: 32px;
}

.picker-header h2 {
  font-size: 1.5em;
  color: #fff;
  margin-bottom: 8px;
}

.picker-subtitle {
  color: #888;
  font-size: 0.95em;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.suggestion-card {
  background: #1a1a2e;
  border: 2px solid #2a2a4a;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s;
}

.suggestion-card:hover {
  border-color: #6c63ff;
  transform: translateY(-2px);
}

.suggestion-card.selected {
  border-color: #6c63ff;
  background: #1e1e3e;
  box-shadow: 0 0 20px rgba(108, 99, 255, 0.2);
}

.suggestion-title {
  font-size: 1.15em;
  color: #fff;
  margin-bottom: 8px;
}

.suggestion-description {
  color: #aaa;
  font-size: 0.9em;
  line-height: 1.5;
  margin-bottom: 12px;
}

.suggestion-tone {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  background: #252540;
  color: #6c63ff;
  font-size: 0.8em;
  font-weight: 500;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 16px;
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

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-primary {
  background: #6c63ff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a52e0;
}

.btn-secondary {
  background: #2a2a4a;
  color: #aaa;
}

.btn-secondary:hover {
  background: #353560;
}
</style>
