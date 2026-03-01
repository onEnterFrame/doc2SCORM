import { defineStore } from "pinia";
import type { Course, StorySuggestion } from "../types/course";

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
    // Error
    errorMessage: "",
  }),
  actions: {
    reset() {
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
      this.errorMessage = "";
    },
  },
});
