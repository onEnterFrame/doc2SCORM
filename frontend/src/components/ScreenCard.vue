<script setup lang="ts">
import type { Screen } from "../types/course";
import { useCourseStore } from "../stores/courseStore";

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
      <audio
        v-if="screen.audio"
        :src="audioUrl(screen.audio.file)"
        controls
        class="audio-player"
      ></audio>
    </div>

    <div
      v-if="screen.interaction && screen.interaction.type !== 'none'"
      class="interaction"
    >
      <span class="interaction-badge">{{ screen.interaction.type }}</span>
      <p class="interaction-prompt">{{ screen.interaction.prompt }}</p>
    </div>
  </div>
</template>

<style scoped>
.screen-card {
  background: #1a1a2e;
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
}

.screen-title {
  font-size: 1.15em;
  color: #fff;
  margin-bottom: 12px;
}

.screen-image {
  width: 100%;
  max-height: 360px;
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 16px;
  background: #111;
}

.story-text {
  color: #ccc;
  line-height: 1.6;
  padding: 16px;
  background: #15152a;
  border-left: 3px solid #6c63ff;
  border-radius: 0 8px 8px 0;
  margin-bottom: 12px;
}

.on-screen-text {
  color: #6c63ff;
  font-weight: 600;
  font-size: 1.05em;
  margin-bottom: 12px;
}

.narration {
  background: #15152a;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.narration-label {
  font-size: 0.75em;
  text-transform: uppercase;
  color: #666;
  font-weight: 600;
  margin-bottom: 6px;
}

.narration-text {
  color: #aaa;
  font-style: italic;
  margin-bottom: 8px;
}

.audio-player {
  width: 100%;
  height: 36px;
}

.interaction {
  background: #2a2a1a;
  border: 1px solid #4a4a2a;
  border-radius: 8px;
  padding: 16px;
}

.interaction-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  background: #3a3a2a;
  color: #ffc107;
  font-size: 0.75em;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.interaction-prompt {
  color: #ddd;
  font-weight: 500;
}
</style>
