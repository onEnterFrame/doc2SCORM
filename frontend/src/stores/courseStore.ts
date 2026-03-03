import { defineStore } from "pinia";
import type { Course, CourseTheme, StorySuggestion } from "../types/course";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export type Step = 1 | 2 | 3 | 4 | 5;

export type GenerationStatus =
  | "idle"
  | "generating-course"
  | "generating-audio"
  | "building-scorm"
  | "complete"
  | "error";

export const useCourseStore = defineStore("course", {
  state: () => ({
    currentStep: 1 as Step,
    // Step 1: Upload
    sessionId: null as string | null,
    extractedText: "",
    fileName: "",
    wordCount: 0,
    // Step 2: Pick direction
    suggestions: [] as StorySuggestion[],
    selectedDirection: null as StorySuggestion | null,
    // Step 3: Generation
    generationStatus: "idle" as GenerationStatus,
    // Step 4: Preview
    courseData: null as Course | null,
    // Step 5: Download
    scormReady: false,
    downloadUrl: "",
    scormSizeBytes: 0,
    // Publish
    isPublishing: false,
    isPublished: false,
    publicUrl: "",
    // View
    view: "wizard" as "wizard" | "gallery" | "about",
    // Error
    errorMessage: "",
  }),
  actions: {
    applyTheme(theme: CourseTheme) {
      const root = document.documentElement;
      root.style.setProperty("--gradient-start", theme.gradientStart);
      root.style.setProperty("--gradient-end", theme.gradientEnd);
      root.style.setProperty("--accent", theme.accent);
      root.style.setProperty("--text-on-glass", theme.textOnGlass);
      root.style.setProperty("--text-on-glass-secondary", theme.textOnGlassSecondary);
      root.style.setProperty("--orb-1", hexToRgba(theme.gradientEnd, 0.4));
      root.style.setProperty("--orb-2", hexToRgba(theme.accent, 0.25));
      root.style.setProperty("--orb-3", hexToRgba(theme.gradientStart, 0.3));
    },
    resetTheme() {
      const root = document.documentElement;
      root.style.removeProperty("--gradient-start");
      root.style.removeProperty("--gradient-end");
      root.style.removeProperty("--accent");
      root.style.removeProperty("--text-on-glass");
      root.style.removeProperty("--text-on-glass-secondary");
      root.style.removeProperty("--orb-1");
      root.style.removeProperty("--orb-2");
      root.style.removeProperty("--orb-3");
    },
    reset() {
      this.resetTheme();
      this.currentStep = 1;
      this.sessionId = null;
      this.extractedText = "";
      this.fileName = "";
      this.wordCount = 0;
      this.suggestions = [];
      this.selectedDirection = null;
      this.generationStatus = "idle";
      this.courseData = null;
      this.scormReady = false;
      this.downloadUrl = "";
      this.scormSizeBytes = 0;
      this.isPublishing = false;
      this.isPublished = false;
      this.publicUrl = "";
      this.errorMessage = "";
    },
    async publishCourse() {
      if (!this.sessionId) return;
      this.isPublishing = true;
      try {
        const res = await fetch("/api/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: this.sessionId }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Publish failed");
        }
        const data = await res.json();
        this.publicUrl = data.url;
        this.isPublished = true;
      } catch (error) {
        throw error;
      } finally {
        this.isPublishing = false;
      }
    },
  },
});
