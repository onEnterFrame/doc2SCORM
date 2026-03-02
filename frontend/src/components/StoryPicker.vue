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
        v-for="(suggestion, idx) in store.suggestions"
        :key="suggestion.id"
        class="suggestion-card"
        :class="{ selected: store.selectedDirection?.id === suggestion.id }"
        :style="{ animationDelay: (idx * 0.1) + 's' }"
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
  margin-bottom: 36px;
}

.picker-header h2 {
  font-family: var(--font-display);
  font-size: 1.6em;
  color: #fff;
  margin-bottom: 10px;
  text-shadow: 0 2px 8px rgba(0, 60, 20, 0.12);
}

.picker-subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95em;
}

.picker-subtitle strong {
  color: #fff;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 36px;
}

.suggestion-card {
  background: var(--glass);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  padding: 28px 24px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: cardIn 0.5s ease both;
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.suggestion-card:hover {
  background: var(--glass-hover);
  border-color: var(--glass-border-hover);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.suggestion-card.selected {
  background: rgba(255, 255, 255, 0.4);
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 32px rgba(0, 60, 20, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.15);
}

.suggestion-title {
  font-family: var(--font-display);
  font-size: 1.15em;
  color: var(--text-on-glass);
  margin-bottom: 10px;
}

.suggestion-description {
  color: var(--text-on-glass-secondary);
  font-size: 0.9em;
  line-height: 1.6;
  margin-bottom: 16px;
}

.suggestion-tone {
  display: inline-block;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  background: rgba(27, 94, 47, 0.12);
  border: 1px solid rgba(27, 94, 47, 0.2);
  color: var(--accent);
  font-size: 0.78em;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.suggestion-card.selected .suggestion-tone {
  background: rgba(27, 94, 47, 0.2);
  border-color: rgba(27, 94, 47, 0.35);
}

.actions {
  display: flex;
  justify-content: center;
  gap: 14px;
}
</style>
