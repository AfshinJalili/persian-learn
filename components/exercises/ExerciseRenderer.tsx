import type { Exercise } from '@/lib/types';
import IntroExercise from '@/components/exercises/IntroExercise';
import TapPictureExercise from '@/components/exercises/TapPictureExercise';
import ListenChooseExercise from '@/components/exercises/ListenChooseExercise';
import CountObjectsExercise from '@/components/exercises/CountObjectsExercise';
import TraceLetterExercise from '@/components/exercises/TraceLetterExercise';
import MatchPairsExercise from '@/components/exercises/MatchPairsExercise';
import TenFrameExercise from '@/components/exercises/TenFrameExercise';
import BreakPointsExercise from '@/components/exercises/BreakPointsExercise';
import ReadClockExercise from '@/components/exercises/ReadClockExercise';
import ChooseDigitExercise from '@/components/exercises/ChooseDigitExercise';
import EquationExercise from '@/components/exercises/EquationExercise';
import CompareMoreLessExercise from '@/components/exercises/CompareMoreLessExercise';
import NumberLineExercise from '@/components/exercises/NumberLineExercise';
import BuildWordExercise from '@/components/exercises/BuildWordExercise';
import CountMoneyExercise from '@/components/exercises/CountMoneyExercise';
import PayAmountExercise from '@/components/exercises/PayAmountExercise';
import MakeChangeExercise from '@/components/exercises/MakeChangeExercise';

interface ExerciseRendererProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  onContinue: () => void;
  onTraced: (answer: string) => void;
  disabled: boolean;
  answerState?: 'idle' | 'correct' | 'wrong';
  autoplay?: boolean;
}

export default function ExerciseRenderer({
  exercise,
  userAnswer,
  onAnswerChange,
  onContinue,
  onTraced,
  disabled,
  answerState = 'idle',
  autoplay = true,
}: ExerciseRendererProps) {
  switch (exercise.type) {
    case 'intro':
      return <IntroExercise exercise={exercise} onContinue={onContinue} autoplay={autoplay} />;
    case 'tap_picture':
      return (
        <TapPictureExercise
          exercise={exercise}
          userAnswer={userAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
          answerState={answerState}
        />
      );
    case 'listen_choose':
      return (
        <ListenChooseExercise
          exercise={exercise}
          userAnswer={userAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
          answerState={answerState}
        />
      );
    case 'count_objects':
      return (
        <CountObjectsExercise
          exercise={exercise}
          userAnswer={userAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
          answerState={answerState}
        />
      );
    case 'choose_digit':
      return (
        <ChooseDigitExercise
          exercise={exercise}
          userAnswer={userAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
          answerState={answerState}
        />
      );
    case 'match_pairs':
      return (
        <MatchPairsExercise
          exercise={exercise}
          userAnswer={userAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
        />
      );
    case 'trace_letter':
      return <TraceLetterExercise exercise={exercise} onComplete={onTraced} />;
    case 'compare_more_less':
      return (
        <CompareMoreLessExercise
          exercise={exercise}
          userAnswer={userAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
        />
      );
    case 'number_line':
      return (
        <NumberLineExercise
          exercise={exercise}
          userAnswer={userAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
        />
      );
    case 'build_word':
      return (
        <BuildWordExercise
          exercise={exercise}
          userAnswer={userAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
        />
      );
    case 'equation':
      return (
        <EquationExercise
          exercise={exercise}
          userAnswer={userAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
        />
      );
    case 'count_money':
      return (
        <CountMoneyExercise
          exercise={exercise}
          userAnswer={userAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
        />
      );
    case 'pay_amount':
      return (
        <PayAmountExercise
          exercise={exercise}
          userAnswer={userAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
        />
      );
    case 'make_change':
      return (
        <MakeChangeExercise
          exercise={exercise}
          userAnswer={userAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
        />
      );
    case 'read_clock':
      return (
        <ReadClockExercise
          exercise={exercise}
          userAnswer={userAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
        />
      );
    case 'ten_frame':
      return (
        <TenFrameExercise
          exercise={exercise}
          userAnswer={userAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
        />
      );
    case 'break_points':
      return (
        <BreakPointsExercise
          exercise={exercise}
          userAnswer={userAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
        />
      );
    default: {
      const unexpected: never = exercise.type;
      void unexpected;
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          <p className="text-2xl font-bold text-[var(--ink)]">این تمرین نمایش داده نشد</p>
        </div>
      );
    }
  }
}
