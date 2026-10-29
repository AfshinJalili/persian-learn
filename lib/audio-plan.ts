import { lessonSpokenTexts, uiSpokenTexts, type ContentTrack } from './spoken-texts';
import { spokenTextKey } from './audio-id';

export type AudioPlan = {
  /** Manifest voice + clip count, so the worker knows when the plan changed. */
  version: string;
  /** Clips the app shell plays (greetings, praise, unit titles). */
  ui: string[];
  /** Lessons in course order, each with the clips it can play. */
  tracks: Record<string, Array<{ id: string; clips: string[] }>>;
  /** Every clip in the manifest, so nothing is left out of the idle pass. */
  all: string[];
};

type Manifest = { voice: string; count: number; items: Array<{ hash: string; text: string }> };

/**
 * Maps each lesson to the clips it plays, using only clips that exist in the
 * audio manifest. `hashText` is the manifest's text -> hash function.
 */
export function buildAudioPlan(
  tracks: Record<string, ContentTrack>,
  manifest: Manifest,
  hashText: (key: string) => string
): AudioPlan {
  const known = new Set(manifest.items.map((item) => item.hash));
  const toClips = (texts: Iterable<string>) => {
    const out = new Set<string>();
    for (const text of texts) {
      const hash = hashText(spokenTextKey(text));
      if (known.has(hash)) out.add(hash);
    }
    return [...out];
  };
  const uiTexts = new Set(uiSpokenTexts());
  const plan: AudioPlan = {
    version: `${manifest.voice}:${manifest.count}`,
    ui: [],
    tracks: {},
    all: [...known],
  };
  for (const [name, data] of Object.entries(tracks)) {
    plan.tracks[name] = [];
    for (const unit of data.units) {
      uiTexts.add(unit.title);
      for (const lesson of unit.lessons) {
        plan.tracks[name].push({ id: lesson.id, clips: toClips(lessonSpokenTexts(lesson)) });
      }
    }
  }
  plan.ui = toClips(uiTexts);
  return plan;
}
