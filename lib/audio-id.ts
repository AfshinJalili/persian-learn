import { normalizePersianText } from './persian';

export function spokenTextKey(text: string): string {
  return normalizePersianText(text).trim();
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function audioContentHash(text: string): Promise<string> {
  const key = spokenTextKey(text);
  const data = new TextEncoder().encode(key);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(new Uint8Array(digest)).slice(0, 32);
}

export function audioUrlForHash(hash: string): string {
  return `/audio/${hash}.mp3`;
}
