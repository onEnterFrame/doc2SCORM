<script setup lang="ts">
import type { QuizQuestion } from "../types/course";

defineProps<{
  questions: QuizQuestion[];
  moduleTitle: string;
}>();
</script>

<template>
  <div class="quiz-preview">
    <h3 class="quiz-title">Knowledge Check: {{ moduleTitle }}</h3>

    <div v-for="(q, qi) in questions" :key="qi" class="quiz-question">
      <p class="question-text">{{ qi + 1 }}. {{ q.question }}</p>
      <div class="choices">
        <div
          v-for="(choice, ci) in q.choices"
          :key="ci"
          class="choice"
          :class="{ correct: ci === q.answerIndex }"
        >
          <span class="choice-letter">{{ "ABCD"[ci] }}</span>
          {{ choice }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quiz-preview {
  background: var(--glass);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: var(--shadow);
}

.quiz-title {
  font-family: var(--font-display);
  color: var(--text-on-glass);
  font-size: 1.1em;
  margin-bottom: 20px;
}

.quiz-question {
  margin-bottom: 20px;
}

.question-text {
  color: var(--text-on-glass);
  font-weight: 600;
  margin-bottom: 10px;
}

.choices {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.choice {
  padding: 11px 14px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-sm);
  color: var(--text-on-glass-secondary);
  font-size: 0.9em;
  display: flex;
  align-items: center;
  gap: 10px;
}

.choice.correct {
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  border-color: color-mix(in srgb, var(--accent) 30%, transparent);
  color: var(--accent);
}

.choice-letter {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78em;
  font-weight: 700;
  flex-shrink: 0;
}

.choice.correct .choice-letter {
  background: color-mix(in srgb, var(--accent) 20%, transparent);
}
</style>
