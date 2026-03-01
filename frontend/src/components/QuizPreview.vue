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
  background: #1a1a2e;
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
}

.quiz-title {
  color: #fff;
  font-size: 1.1em;
  margin-bottom: 20px;
}

.quiz-question {
  margin-bottom: 20px;
}

.question-text {
  color: #ddd;
  font-weight: 600;
  margin-bottom: 10px;
}

.choices {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.choice {
  padding: 10px 14px;
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  color: #aaa;
  font-size: 0.9em;
  display: flex;
  align-items: center;
  gap: 10px;
}

.choice.correct {
  border-color: #2d5a2d;
  background: #1a2a1a;
  color: #4caf50;
}

.choice-letter {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #252540;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8em;
  font-weight: 700;
  flex-shrink: 0;
}

.choice.correct .choice-letter {
  background: #2d5a2d;
}
</style>
