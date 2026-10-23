import { lessonSpokenTexts, uiSpokenTexts, type ContentTrack } from './spoken-texts';
import { spokenTextKey } from './audio-id';

export type AudioPlan = {
  /**
   * Manifest voice, clip count and a digest of every clip's id and audio-bytes
   * hash, so the plan changes whenever a clip is added, removed, swapped for
   * another phrase or re-synthesized.
   */
  version: string;
  /**
   * Clip id -> hash of its audio bytes (see CLIP_BYTES_HASH_LENGTH). The
   * worker stores each clip under /audio/<id>.mp3?v=<bytes hash>, so a clip
   * whose audio changes gets a new cache key and the old bytes are dropped.
   */
  clips: Record<string, string>;
  /** Clips the app shell plays (greetings, praise, unit titles). */
  ui: string[];
  /** Lessons in course order, each with the clips it can play. */
  tracks: Record<string, Array<{ id: string; clips: string[] }>>;
  /** Every clip in the manifest, so nothing is left out of the idle pass. */
  all: string[];
};

type Manifest = { voice: string; count: number; items: Array<{ hash: string; text: string }> };

/** Hex characters kept from the SHA-256 of a clip's bytes (64 bits). */
export const CLIP_BYTES_HASH_LENGTH = 16;

/**
 * Maps each lesson to the clips it plays, using only clips that exist in the
 * audio manifest and on disk. `hashText` is the manifest's text -> hash
 * function; `clipBytesHash` returns the hash of /audio/<id>.mp3's bytes (null
 * if the file is missing), computed from the files at build time so it can't
 * drift from the audio that is served.
 */
export function buildAudioPlan(
  tracks: Record<string, ContentTrack>,
  manifest: Manifest,
  hashText: (key: string) => string,
  clipBytesHash: (id: string) => string | null
): AudioPlan {
  const clips: Record<string, string> = {};
  for (const item of manifest.items) {
    const bytes = clipBytesHash(item.hash);
    if (bytes) clips[item.hash] = bytes;
  }
  const known = new Set(Object.keys(clips));
  const toClips = (texts: Iterable<string>) => {
    const out = new Set<string>();
    for (const text of texts) {
      const hash = hashText(spokenTextKey(text));
      if (known.has(hash)) out.add(hash);
    }
    return [...out];
  };
  const uiTexts = new Set(uiSpokenTexts());
  const clipSet = [...known]
    .sort()
    .map((id) => `${id}:${clips[id]}`)
    .join('\n');
  const plan: AudioPlan = {
    version: `${manifest.voice}:${known.size}:${hashText(clipSet)}`,
    clips,
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
