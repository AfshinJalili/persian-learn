export type ExerciseType =
  | 'intro'
  | 'tap_picture'
  | 'listen_choose'
  | 'count_objects'
  | 'choose_digit'
  | 'match_pairs'
  | 'trace_letter'
  | 'compare_more_less'
  | 'number_line'
  | 'build_word'
  | 'equation'
  | 'count_money'
  | 'pay_amount'
  | 'make_change'
  | 'read_clock'
  | 'ten_frame'
  | 'break_points';

export interface Exercise {
  id: string;
  type: ExerciseType;
  prompt: string;
  audio_script: string;
  payload: Record<string, unknown>;
  answer: string;
  distractors: string[];
  feedback_correct: string;
  feedback_wrong: string;
}

export interface Lesson {
  id: string;
  title: string;
  exercises: Exercise[];
}

export interface Unit {
  id: string;
  title: string;
  emoji: string;
  goal: string;
  lessons: Lesson[];
}

export interface Track {
  track: string;
  units: Unit[];
}

export interface UserProgress {
  currentTrack: 'math' | 'alphabet';
  completedLessons: string[];
  completedUnits: string[];
  xp: number;
  streak: number;
  streakBest: number;
  lastActivityDate: string;
  dailyGoal: number;
  dailyLessonsCompleted: number;
  restDaysUsed: number;
  weakItems: Array<{
    exerciseId: string;
    missCount: number;
    lastSeen: string;
  }>;
  avatar: string;
  name: string;
  startDate: string;
}

export interface LessonProgress {
  lessonId: string;
  exerciseIndex: number;
  answers: Array<{
    exerciseId: string;
    correct: boolean;
    attempts: number;
  }>;
  xpEarned: number;
  startTime: number;
}
