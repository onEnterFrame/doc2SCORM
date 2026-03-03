<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useCourseStore } from "../stores/courseStore";
import type { GalleryEntry } from "../types/course";

const store = useCourseStore();
const courses = ref<GalleryEntry[]>([]);
const loading = ref(true);
const error = ref("");

onMounted(async () => {
  try {
    const res = await fetch("/api/gallery");
    if (!res.ok) throw new Error("Failed to load gallery");
    const data = await res.json();
    courses.value = data.courses;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to load gallery";
  } finally {
    loading.value = false;
  }
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function openCourse(url: string) {
  window.open(url, "_blank", "noopener");
}
</script>

<template>
  <div class="gallery">
    <div class="gallery-header">
      <button class="btn btn-ghost" @click="store.view = 'wizard'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        Back to Creator
      </button>
      <h2 class="gallery-title">Course Gallery</h2>
    </div>

    <div v-if="loading" class="gallery-loading">
      <div class="loading-spinner"></div>
      <p>Loading gallery...</p>
    </div>

    <div v-else-if="error" class="gallery-empty">
      <p>{{ error }}</p>
    </div>

    <div v-else-if="courses.length === 0" class="gallery-empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
      <p>No courses published yet.</p>
      <p class="empty-sub">Generate a course and click "Make Public" to share it here.</p>
    </div>

    <div v-else class="gallery-grid">
      <div
        v-for="course in courses"
        :key="course.id"
        class="gallery-card"
        :style="{
          '--card-accent': course.theme?.accent || '#1b5e2f',
          '--card-grad-start': course.theme?.gradientStart || '#6abf78',
          '--card-grad-end': course.theme?.gradientEnd || '#7acc8e',
        } as any"
        @click="openCourse(course.url)"
      >
        <div class="card-thumbnail">
          <img
            v-if="course.thumbnail"
            :src="course.thumbnail"
            :alt="course.title"
          />
          <div v-else class="card-placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
        </div>
        <div class="card-body">
          <h3 class="card-title">{{ course.title }}</h3>
          <p class="card-description">{{ course.description }}</p>
          <div class="card-meta">
            <span>{{ course.moduleCount }} modules</span>
            <span class="meta-dot"></span>
            <span>{{ course.screenCount }} screens</span>
            <span class="meta-dot"></span>
            <span>{{ formatDate(course.publishedAt) }}</span>
          </div>
        </div>
        <div class="card-accent-bar"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gallery {
  animation: fadeUp 0.5s ease;
}

.gallery-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.gallery-header .btn {
  display: flex;
  align-items: center;
  gap: 6px;
}

.gallery-title {
  font-family: var(--font-display);
  color: var(--text-on-glass);
  font-size: 1.5em;
}

.gallery-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 60px 0;
  color: var(--text-on-glass-secondary);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.gallery-empty {
  text-align: center;
  padding: 60px 0;
  color: var(--text-on-glass-secondary);
}

.empty-icon {
  opacity: 0.4;
  margin-bottom: 16px;
}

.empty-sub {
  font-size: 0.85em;
  margin-top: 8px;
  opacity: 0.7;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.gallery-card {
  position: relative;
  background: var(--glass);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.gallery-card:hover {
  transform: translateY(-4px);
  border-color: var(--glass-border-hover);
  box-shadow: var(--shadow-lg);
}

.card-thumbnail {
  height: 160px;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    var(--card-grad-start),
    var(--card-grad-end)
  );
}

.card-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
}

.card-body {
  padding: 18px;
}

.card-title {
  font-family: var(--font-display);
  color: var(--text-on-glass);
  font-size: 1.05em;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-description {
  color: var(--text-on-glass-secondary);
  font-size: 0.82em;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 12px;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72em;
  color: var(--text-on-glass-secondary);
  opacity: 0.8;
}

.meta-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--text-on-glass-secondary);
  opacity: 0.5;
}

.card-accent-bar {
  height: 3px;
  background: linear-gradient(
    90deg,
    var(--card-accent),
    var(--card-grad-end)
  );
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
