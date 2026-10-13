import { playAudio } from '@/lib/audio';

export const MATCH_UNDO_HINT = 'برای پس گرفتن، ضربدر را بزنید';
export const MATCH_UNDO_HINT_STORAGE_KEY = 'pl-match-undo-hint';

let playedThisSession = false;

export function resetMatchUndoHintForTests() {
  playedThisSession = false;
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(MATCH_UNDO_HINT_STORAGE_KEY);
    }
  } catch {
    /* private mode / blocked storage */
  }
}

export function consumeMatchUndoHint(): boolean {
  if (playedThisSession) return false;
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(MATCH_UNDO_HINT_STORAGE_KEY) === '1') {
      playedThisSession = true;
      return false;
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(MATCH_UNDO_HINT_STORAGE_KEY, '1');
    }
  } catch {
    /* private mode / blocked storage */
  }
  playedThisSession = true;
  return true;
}

export function maybePlayMatchUndoHint() {
  if (!consumeMatchUndoHint()) return;
  playAudio(MATCH_UNDO_HINT, false).catch(() => {});
}
