import { readFileSync } from 'fs';
import { join } from 'path';
import { allSpokenTexts, type ContentTrack } from '../lib/spoken-texts';

const ROOT = join(__dirname, '..');

function loadTrackJson(name: string): ContentTrack {
  return JSON.parse(readFileSync(join(ROOT, 'public', 'content', name), 'utf8')) as ContentTrack;
}

export function collectSpokenTexts(): string[] {
  return allSpokenTexts([loadTrackJson('math.json'), loadTrackJson('alphabet.json')]);
}
