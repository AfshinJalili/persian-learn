import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { generateAudioId } from '../lib/audio-id';
import { collectSpokenTexts } from './collect-spoken-texts';

async function main() {
  const texts = collectSpokenTexts();
  const missing: Array<{ text: string; id: string }> = [];
  for (const text of texts) {
    const id = await generateAudioId(text);
    if (!existsSync(join(process.cwd(), 'public', 'audio', `${id}.mp3`))) {
      missing.push({ text, id });
    }
  }
  const dest = join(process.cwd(), 'scripts', 'missing-audio.json');
  writeFileSync(dest, `${JSON.stringify(missing, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${missing.length} missing-audio entries → ${dest}`);
}

void main();
