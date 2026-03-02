export interface CourseTheme {
  gradientStart: string;
  gradientEnd: string;
  accent: string;
  textOnGlass: string;
  textOnGlassSecondary: string;
}

export interface Course {
  title: string;
  theme?: CourseTheme;
  modules: Module[];
}

export interface Module {
  title: string;
  narrativeTheme: string;
  screens: Screen[];
  quiz: QuizQuestion[];
}

export interface Screen {
  id: string;
  title: string;
  storyText: string;
  narration: string;
  onScreenText: string;
  image: {
    file: string;
    alt: string;
  } | null;
  audio: {
    file: string;
  } | null;
  interaction: {
    type: "reflection" | "decision" | "none";
    prompt: string;
    options?: {
      label: string;
      feedback: string;
      isRecommended?: boolean;
    }[];
  } | null;
}

export interface QuizQuestion {
  type: "mcq";
  question: string;
  choices: string[];
  answerIndex: number;
}

export interface StorySuggestion {
  id: string;
  title: string;
  description: string;
  tone: string;
}
