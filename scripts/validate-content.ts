import { readFileSync } from 'fs';
import { join } from 'path';

interface Exercise {
  id: string;
  type: string;
  prompt: string;
  audio_script: string;
  payload: {
    display?: string;
    objects?: string;
    letter?: string;
    [key: string]: unknown;
  };
  answer: string;
  distractors: string[];
}

interface Lesson {
  id: string;
  title: string;
  exercises: Exercise[];
}

interface Unit {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Track {
  track: string;
  units: Unit[];
}

const ALPHABET_ORDER = [
  { lesson: 1, letters: ['آ', 'ا', 'ب'] },
  { lesson: 2, letters: ['د'] },
  { lesson: 3, letters: ['م', 'س'] },
  { lesson: 4, letters: ['و', 'ت'] },
  { lesson: 5, letters: ['ر', 'ن'] },
  { lesson: 6, letters: ['ی', 'ز'] },
  { lesson: 7, letters: ['ش', 'ه'] },
  { lesson: 8, letters: ['اُ'] },
  { lesson: 9, letters: ['ک'] },
  { lesson: 10, letters: ['پ', 'گ'] },
  { lesson: 11, letters: ['ف', 'خ'] },
  { lesson: 12, letters: ['ق', 'ل'] },
  { lesson: 13, letters: ['ج'] },
  { lesson: 14, letters: ['چ'] },
  { lesson: 15, letters: ['ژ'] },
  { lesson: 17, letters: ['ص', 'ذ'] },
  { lesson: 18, letters: ['ع', 'ث'] },
  { lesson: 19, letters: ['ح'] },
  { lesson: 20, letters: ['ض', 'ط'] },
  { lesson: 21, letters: ['غ'] },
  { lesson: 22, letters: ['ظ'] },
];

function getTaughtLetters(lessonNumber: number): Set<string> {
  const taught = new Set<string>();
  for (const entry of ALPHABET_ORDER) {
    if (entry.lesson <= lessonNumber) {
      entry.letters.forEach(l => taught.add(l));
    }
  }
  return taught;
}

function stripDiacritics(text: string): string {
  return text
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/\u200C/g, '');
}

function extractLetters(word: string): Set<string> {
  const stripped = stripDiacritics(word);
  return new Set(
    stripped
      .split('')
      .filter(c => 
        c.match(/[\u0600-\u06FF]/) && 
        c !== '\u0640' &&
        c !== ' '
      )
  );
}

function validateContent() {
  console.log('🔍 Validating alphabet track content...\n');

  const alphabetPath = join(process.cwd(), 'public/content/alphabet.json');
  const content: Track = JSON.parse(readFileSync(alphabetPath, 'utf-8'));

  const violations: Array<{
    unitId: string;
    lessonId: string;
    exerciseId: string;
    word: string;
    untaughtLetters: string[];
  }> = [];

  let lessonNumber = 0;

  for (const unit of content.units) {
    for (const lesson of unit.lessons) {
      lessonNumber++;
      const taughtLetters = getTaughtLetters(lessonNumber);

      for (const exercise of lesson.exercises) {
        const wordsToCheck: string[] = [];

        if (exercise.payload.display) {
          wordsToCheck.push(exercise.payload.display);
        }

        if (exercise.answer) {
          wordsToCheck.push(exercise.answer);
        }

        exercise.distractors.forEach(d => {
          if (d && typeof d === 'string') {
            wordsToCheck.push(d);
          }
        });

        for (const word of wordsToCheck) {
          const letters = extractLetters(word);
          const untaught = Array.from(letters).filter(l => !taughtLetters.has(l));

          if (untaught.length > 0) {
            violations.push({
              unitId: unit.id,
              lessonId: lesson.id,
              exerciseId: exercise.id,
              word,
              untaughtLetters: untaught,
            });
          }
        }
      }
    }
  }

  if (violations.length === 0) {
    console.log('✅ No violations found! All words use only taught letters.\n');
  } else {
    console.log(`❌ Found ${violations.length} violations:\n`);
    violations.forEach((v, i) => {
      console.log(`${i + 1}. ${v.lessonId} (${v.exerciseId})`);
      console.log(`   Word: "${v.word}"`);
      console.log(`   Untaught letters: ${v.untaughtLetters.join(', ')}\n`);
    });
  }

  console.log('📊 Validation Summary:');
  console.log(`   Total units: ${content.units.length}`);
  console.log(`   Total lessons checked: ${lessonNumber}`);
  console.log(`   Violations: ${violations.length}`);

  if (violations.length > 0) {
    process.exit(1);
  }
}

validateContent();
