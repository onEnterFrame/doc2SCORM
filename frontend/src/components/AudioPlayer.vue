<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from "vue";

const props = defineProps<{
  src: string;
  autoplay?: boolean;
  bare?: boolean;
}>();

const audioEl = ref<HTMLAudioElement | null>(null);
const playing = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const seeking = ref(false);
const pendingPlay = ref(props.autoplay ?? false);

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function togglePlay() {
  if (!audioEl.value) return;
  if (playing.value) {
    audioEl.value.pause();
  } else {
    audioEl.value.play().catch(() => {});
  }
}

function onLoadedMetadata() {
  if (audioEl.value) {
    duration.value = audioEl.value.duration;
  }
}

function onCanPlay() {
  if (pendingPlay.value) {
    pendingPlay.value = false;
    audioEl.value?.play().catch(() => {});
  }
}

function onTimeUpdate() {
  if (!seeking.value && audioEl.value) {
    currentTime.value = audioEl.value.currentTime;
  }
}

function onPlay() {
  playing.value = true;
}

function onPause() {
  playing.value = false;
}

function onEnded() {
  playing.value = false;
  currentTime.value = 0;
}

// Seek via click on track
const trackRef = ref<HTMLElement | null>(null);

function seekFromEvent(e: MouseEvent | Touch) {
  if (!trackRef.value || !audioEl.value) return;
  const rect = trackRef.value.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  audioEl.value.currentTime = ratio * duration.value;
  currentTime.value = audioEl.value.currentTime;
}

function onTrackClick(e: MouseEvent) {
  seekFromEvent(e);
}

function onThumbDown(e: MouseEvent) {
  e.preventDefault();
  seeking.value = true;
  document.addEventListener("mousemove", onThumbMove);
  document.addEventListener("mouseup", onThumbUp);
}

function onThumbMove(e: MouseEvent) {
  seekFromEvent(e);
}

function onThumbUp() {
  seeking.value = false;
  document.removeEventListener("mousemove", onThumbMove);
  document.removeEventListener("mouseup", onThumbUp);
}

function onTrackTouchStart(e: TouchEvent) {
  e.preventDefault();
  seeking.value = true;
  seekFromEvent(e.touches[0]);
  document.addEventListener("touchmove", onTrackTouchMove, { passive: false });
  document.addEventListener("touchend", onTrackTouchEnd);
}

function onTrackTouchMove(e: TouchEvent) {
  e.preventDefault();
  seekFromEvent(e.touches[0]);
}

function onTrackTouchEnd() {
  seeking.value = false;
  document.removeEventListener("touchmove", onTrackTouchMove);
  document.removeEventListener("touchend", onTrackTouchEnd);
}

onBeforeUnmount(() => {
  document.removeEventListener("mousemove", onThumbMove);
  document.removeEventListener("mouseup", onThumbUp);
  document.removeEventListener("touchmove", onTrackTouchMove);
  document.removeEventListener("touchend", onTrackTouchEnd);
});

// Reset state when src changes and queue autoplay
watch(
  () => props.src,
  () => {
    playing.value = false;
    currentTime.value = 0;
    duration.value = 0;
    pendingPlay.value = props.autoplay ?? false;
  }
);

const progressPercent = () =>
  duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0;

// Exposed API for parent control
function play() {
  if (!audioEl.value) return Promise.resolve();
  // If audio has enough data, play immediately; otherwise defer to canplay
  if (audioEl.value.readyState >= 3) {
    return audioEl.value.play() ?? Promise.resolve();
  }
  pendingPlay.value = true;
  return Promise.resolve();
}
function pause() {
  pendingPlay.value = false;
  audioEl.value?.pause();
}
function stop() {
  pendingPlay.value = false;
  if (audioEl.value) {
    audioEl.value.pause();
    audioEl.value.currentTime = 0;
  }
}

defineExpose({ play, pause, stop });
</script>

<template>
  <div class="ap" :class="{ 'ap-bare': bare }">
    <audio
      ref="audioEl"
      :src="src"
      @loadedmetadata="onLoadedMetadata"
      @canplay="onCanPlay"
      @timeupdate="onTimeUpdate"
      @play="onPlay"
      @pause="onPause"
      @ended="onEnded"
    ></audio>

    <button class="ap-play" @click="togglePlay" :aria-label="playing ? 'Pause' : 'Play'">
      <!-- Pause icon -->
      <svg v-if="playing" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
      <!-- Play icon -->
      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.04-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14z" />
      </svg>
    </button>

    <div
      ref="trackRef"
      class="ap-track-hit"
      @mousedown="onTrackClick"
      @touchstart="onTrackTouchStart"
    >
      <div class="ap-track">
        <div class="ap-track-fill" :style="{ width: progressPercent() + '%' }"></div>
        <div
          class="ap-thumb"
          :style="{ left: progressPercent() + '%' }"
          @mousedown.stop="onThumbDown"
        ></div>
      </div>
    </div>

    <span class="ap-time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
  </div>
</template>

<style scoped>
.ap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-sm, 10px);
  margin-bottom: 16px;
  user-select: none;
}

.ap-bare {
  background: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border: none;
  padding: 0;
  margin: 0;
}

.ap-play {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.ap-play:hover {
  background: rgba(255, 255, 255, 0.28);
  border-color: rgba(255, 255, 255, 0.45);
  color: #fff;
}

.ap-track-hit {
  flex: 1;
  padding: 10px 0;
  cursor: pointer;
}

.ap-track {
  height: 6px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  position: relative;
}

.ap-track-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 3px;
  pointer-events: none;
  transition: width 0.1s linear;
}

.ap-thumb {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  transform: translate(-50%, -50%);
  cursor: grab;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.15s ease;
}

.ap-thumb:active {
  cursor: grabbing;
}

.ap:hover .ap-thumb {
  width: 14px;
  height: 14px;
  background: #fff;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.3);
}

.ap-time {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.78em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 72px;
  text-align: right;
}
</style>
