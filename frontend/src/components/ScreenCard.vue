<script setup lang="ts">
import type { Screen } from "../types/course";
import { useCourseStore } from "../stores/courseStore";
import AudioPlayer from "./AudioPlayer.vue";

const props = defineProps<{
  screen: Screen;
}>();

const store = useCourseStore();

function imageUrl(file: string) {
  return `/api/assets/${store.sessionId}/assets/${file}`;
}

function audioUrl(file: string) {
  return `/api/assets/${store.sessionId}/assets/${file}`;
}
</script>

<template>
  <div class="screen-card">
    <h3 class="screen-title">{{ screen.title }}</h3>

    <img
      v-if="screen.image"
      :src="imageUrl(screen.image.file)"
      :alt="screen.image.alt"
      class="screen-image"
    />

    <div class="story-text">{{ screen.storyText }}</div>

    <p v-if="screen.onScreenText" class="on-screen-text">
      {{ screen.onScreenText }}
    </p>

    <div v-if="screen.narration" class="narration">
      <p class="narration-label">Narration</p>
      <p class="narration-text">"{{ screen.narration }}"</p>
      <AudioPlayer v-if="screen.audio" :src="audioUrl(screen.audio.file)" />
    </div>

    <div
      v-if="screen.interaction && screen.interaction.type !== 'none'"
      class="interaction-box"
    >
      <span class="interaction-badge">
        <svg v-if="screen.interaction.type === 'reflection'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 16 16 12 12 8"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        {{ screen.interaction.type }}
      </span>
      <p class="interaction-prompt">{{ screen.interaction.prompt }}</p>
    </div>
  </div>
</template>

<style scoped>
.screen-card {
  background: var(--glass);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: var(--shadow);
}

.screen-title {
  font-family: var(--font-display);
  font-size: 1.15em;
  color: var(--text-on-glass);
  margin-bottom: 12px;
}

.screen-image {
  width: 100%;
  max-height: 360px;
  object-fit: contain;
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
  background: rgba(255, 255, 255, 0.08);
}

.story-text {
  color: var(--text-on-glass-secondary);
  line-height: 1.7;
  padding: 16px 18px;
  background: rgba(255, 255, 255, 0.1);
  border-left: 3px solid var(--accent);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  margin-bottom: 12px;
}

.on-screen-text {
  color: var(--accent);
  font-weight: 600;
  font-size: 1.05em;
  margin-bottom: 12px;
}

.narration {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-sm);
  padding: 16px;
  margin-bottom: 12px;
}

.narration-label {
  font-size: 0.72em;
  text-transform: uppercase;
  color: var(--text-on-glass-secondary);
  font-weight: 700;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}

.narration-text {
  color: var(--text-on-glass-secondary);
  font-style: italic;
  margin-bottom: 8px;
  line-height: 1.5;
}

.interaction-box {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: var(--radius-sm);
  padding: 16px;
}

.interaction-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-on-glass);
  font-size: 0.72em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}

.interaction-prompt {
  color: var(--text-on-glass);
  font-weight: 500;
}
</style>
