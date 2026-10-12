import { playAudio } from './audio';
import { normalizePersianText } from './persian';

const ONES = ['صفر', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'] as const;
const TEENS = [
  'ده',
  'یازده',
  'دوازده',
  'سیزده',
  'چهارده',
  'پانزده',
  'شانزده',
  'هفده',
  'هجده',
  'نوزده',
] as const;
const TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'] as const;

const LETTER_NAMES: Record<string, string> = {
  آ: 'الف',
  ا: 'الف',
  أ: 'الف',
  إ: 'الف',
  ب: 'به',
  پ: 'په',
  ت: 'ته',
  ث: 'ثه',
  ج: 'جیم',
  چ: 'چه',
  ح: 'حه',
  خ: 'خه',
  د: 'دال',
  ذ: 'ذال',
  ر: 'ره',
  ز: 'زه',
  ژ: 'ژه',
  س: 'سین',
  ش: 'شین',
  ص: 'صاد',
  ض: 'ضاد',
  ط: 'طا',
  ظ: 'ظا',
  ع: 'عین',
  غ: 'غین',
  ف: 'فه',
  ق: 'قاف',
  ک: 'کاف',
  گ: 'گاف',
  ل: 'لام',
  م: 'میم',
  ن: 'نون',
  و: 'واو',
  ه: 'هه',
  ة: 'هه',
  ی: 'یه',
  ي: 'یه',
};

const EMOJI_WORDS: Record<string, string> = {
  '🍎': 'سیب',
  '🍞': 'نان',
  '☕': 'چای',
  '🍇': 'انگور',
  '🌷': 'لاله',
  '🌲': 'سرو',
  '🌳': 'درخت',
  '☀️': 'خورشید',
  '🌞': 'خورشید',
  '🌙': 'ماه',
  '🔑': 'کلید',
  '📱': 'گوشی',
  '🥚': 'تخم‌مرغ',
  '🍊': 'پرتقال',
  '🏠': 'خانه',
  '💧': 'آب',
  '⏰': 'ساعت',
  '🚪': 'در',
  '🥛': 'شیر',
  '✏️': 'مداد',
  '🍅': 'گوجه',
  '🧅': 'پیاز',
  '👨': 'پدر',
  '👩': 'مادر',
  '🧔': 'برادر',
  '👭': 'خواهر',
  '🍌': 'موز',
  '🌬️': 'باد',
  '🙏': 'تشکر',
  '🌰': 'بادام',
  '🛁': 'وان',
  '👂': 'گوش',
  '🥩': 'گوشت',
  '🌅': 'صبح',
  '🐎': 'اسب',
  '🇮🇷': 'ایران',
  '🧊': 'قند',
  '🧥': 'ژاکت',
  '🧼': 'صابون',
  '👃': 'بینی',
  '💂': 'سرباز',
  '🌊': 'دریا',
  '💵': 'پول',
  '👞': 'کفش',
  '🌕': 'ماه',
  '🌧️': 'باران',
  '🦶': 'پا',
  '🥒': 'خیار',
  '🐥': 'جوجه',
  '🧀': 'پنیر',
  '🪚': 'اره',
  '🔊': 'صدا',
  '🪑': 'صندلی',
  '🌽': 'ذرت',
  '🍂': 'پاییز',
  '🎉': 'عید',
  '🧍': 'آدم',
  '🧺': 'سبد',
  '💇': 'مو',
  '💨': 'دود',
  '🤝': 'دوست',
  '🦷': 'دندان',
  '✉️': 'نامه',
  '📅': 'تقویم',
  '🔥': 'آتش',
  '🌼': 'یاس',
  '⛱️': 'سایه',
  '✨': 'ستاره',
  '🚌': 'اتوبوس',
  '✊': 'مشت',
  '📖': 'کتاب',
  '🍢': 'کباب',
  '🧱': 'دیوار',
  '🕊️': 'کبوتر',
  '🐕': 'سگ',
  '❄️': 'برف',
  '🖊️': 'خودکار',
  '⛰️': 'کوه',
  '👀': 'چشم',
  '😴': 'خواب',
  '👶': 'بچه',
  '🍯': 'عسل',
  '🔺': 'مثلث',
  '🐌': 'حلزون',
  '📄': 'کاغذ',
  '📜': 'کاغذ',
  '💊': 'دارو',
  '🥖': 'نان',
  '🏦': 'بانک',
  '📢': 'بلندگو',
  '🫐': 'توت',
  '🪮': 'شانه',
  '🛍️': 'کیسه',
  '🧑‍⚖️': 'داور',
  '⚽': 'توپ',
  '🥄': 'قاشق',
  '⛵': 'قایق',
  '👑': 'تاج',
  '🧦': 'جوراب',
  '🕌': 'مسجد',
  '🐟': 'ماهی',
  '🧕': 'چادر',
  '👁️': 'چشم',
  '✂️': 'قیچی',
  '🕯️': 'شمع',
  '🤒': 'مریض',
  '🦜': 'طوطی',
  '🐦‍⬛': 'کلاغ',
  '🐔': 'مرغ',
  '🏥': 'بیمارستان',
  '❤️': 'عشق',
  '👎': 'نه',
  '🚗': 'ماشین',
  '🏙️': 'شهر',
  '📞': 'تلفن',
  '🍽️': 'بشقاب',
  '🥣': 'کاسه',
  '😋': 'لذیذ',
  '✅': 'بله',
  '❌': 'نه',
  '⚖️': 'ترازو',
  '🕐': 'ساعت یک',
  '🕑': 'ساعت دو',
  '🕒': 'ساعت سه',
  '🕓': 'ساعت چهار',
  '🕔': 'ساعت پنج',
  '🕕': 'ساعت شش',
  '🕖': 'ساعت هفت',
  '🕗': 'ساعت هشت',
  '🕘': 'ساعت نه',
  '🕙': 'ساعت ده',
  '🕚': 'ساعت یازده',
  '🕛': 'ساعت دوازده',
  '🕜': 'ساعت یک و نیم',
  '🕝': 'ساعت دو و نیم',
  '🕞': 'ساعت سه و نیم',
  '🕟': 'ساعت چهار و نیم',
  '🕠': 'ساعت پنج و نیم',
  '🕡': 'ساعت شش و نیم',
  '🕢': 'ساعت هفت و نیم',
  '🕣': 'ساعت هشت و نیم',
  '🕤': 'ساعت نه و نیم',
  '🕥': 'ساعت ده و نیم',
  '🕦': 'ساعت یازده و نیم',
  '🕧': 'ساعت دوازده و نیم',
};

const DICE_PIPS: Record<string, number> = {
  '⚀': 1,
  '⚁': 2,
  '⚂': 3,
  '⚃': 4,
  '⚄': 5,
  '⚅': 6,
};

const FINGER_COUNTS: Record<string, number> = {
  '☝️': 1,
  '👆': 1,
  '✌️': 2,
  '✋': 5,
};

const COUNTER_EMOJI = new Set(['🔵', '🔴', '👏']);

function splitGraphemes(value: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return [...new Intl.Segmenter('fa', { granularity: 'grapheme' }).segment(value)].map(
      (part) => part.segment
    );
  }
  return Array.from(value);
}

function stripEmojiTone(token: string): string {
  return token.replace(/\uFE0F/g, '').replace(/\u20E3/g, '');
}

function emojiWord(token: string): string | undefined {
  return EMOJI_WORDS[token] ?? EMOJI_WORDS[stripEmojiTone(token)];
}

export function numberWord(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '';
  const n = Math.round(value);
  if (n < 10) return ONES[n] ?? '';
  if (n < 20) return TEENS[n - 10] ?? '';
  if (n === 100) return 'صد';
  if (n > 100) return '';
  const ten = Math.floor(n / 10);
  const one = n % 10;
  const tenWord = TENS[ten];
  if (!tenWord) return '';
  if (one === 0) return tenWord;
  const oneWord = ONES[one];
  if (!oneWord) return tenWord;
  return `${tenWord} و ${oneWord}`;
}

function parseDigitString(token: string): number | null {
  const latin = token.replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));
  if (!/^\d+$/.test(latin)) return null;
  return Number(latin);
}

function letterName(token: string): string | undefined {
  const stripped = token.replace(/[\u064B-\u065F\u0670\u0640]/g, '');
  if (stripped.length === 1) {
    return LETTER_NAMES[stripped];
  }
  return undefined;
}

function hasPersianLetter(token: string): boolean {
  return /[\u0600-\u06FF]/.test(token);
}

function looksLikeFingerCount(parts: string[]): boolean {
  return parts.length > 0 && parts.every((part) => stripEmojiTone(part) in FINGER_COUNTS || part in FINGER_COUNTS);
}

function fingerTotal(parts: string[]): number {
  return parts.reduce((sum, part) => {
    const key = stripEmojiTone(part);
    return sum + (FINGER_COUNTS[part] ?? FINGER_COUNTS[key] ?? 0);
  }, 0);
}

function peersSuggestFingers(peers: string[]): boolean {
  return peers.some((peer) => {
    const parts = splitGraphemes(peer).filter((part) => part.trim().length > 0);
    return looksLikeFingerCount(parts);
  });
}

function peersSuggestTens(peers: string[]): boolean {
  return peers.some((peer) => {
    if (parseDigitString(peer) !== null) return true;
    const parts = splitGraphemes(peer).filter((part) => part.trim().length > 0);
    return parts.length > 1 && parts.every((part) => stripEmojiTone(part) === '📦' || part === '📦');
  });
}

function spokenTime(token: string): string | undefined {
  const match = token.match(/^([0-9۰-۹]{1,2}):([0-9۰-۹]{2})$/);
  if (!match?.[1] || !match[2]) return undefined;
  const hour = parseDigitString(match[1]);
  const minute = parseDigitString(match[2]);
  if (hour === null || minute === null) return undefined;
  const hourWord = numberWord(hour);
  if (!hourWord) return undefined;
  if (minute === 0) return `ساعت ${hourWord}`;
  if (minute === 30) return `ساعت ${hourWord} و نیم`;
  return undefined;
}

function repeatedEmojiSpeech(parts: string[], peers: string[]): string {
  const first = parts[0];
  if (!first) return '';
  const normalized = parts.map((part) => stripEmojiTone(part));
  const same = normalized.every((part) => part === normalized[0]);
  if (!same) {
    return parts
      .map((part) => emojiWord(part) ?? '')
      .filter(Boolean)
      .join(' ');
  }

  const count = parts.length;
  const key = first;

  if (key === '👏' || key === '🔵') {
    return numberWord(count);
  }

  if (key === '📦') {
    if (count > 1 || peersSuggestTens(peers)) {
      return numberWord(count * 10);
    }
    return 'بسته';
  }

  if (key === '✋' || key === '☝️' || key === '✌️' || key === '👆') {
    if (count > 1 || peersSuggestFingers(peers) || key !== '✋') {
      return numberWord(fingerTotal(parts));
    }
    return 'دست';
  }

  if (key in DICE_PIPS) {
    return numberWord(DICE_PIPS[key] ?? 0);
  }

  const word = emojiWord(key);
  if (!word) return '';
  if (count === 1) return word;
  const countWord = numberWord(count);
  return countWord ? `${countWord} ${word}` : word;
}

function tenFrameCount(parts: string[]): string {
  const filled = parts.filter((part) => stripEmojiTone(part) === '🔴').length;
  return numberWord(filled);
}

/**
 * Natural spoken text for a tappable option. Returns '' when the token
 * should stay silent (unknown emoji, empty, punctuation).
 */
export function spokenOption(token: string, peers: string[] = []): string {
  const trimmed = normalizePersianText(token).trim();
  if (!trimmed) return '';

  const time = spokenTime(trimmed);
  if (time) return time;

  const digits = parseDigitString(trimmed);
  if (digits !== null) {
    const word = numberWord(digits);
    if (word) return word;
  }

  const namedLetter = letterName(trimmed);
  if (namedLetter) return namedLetter;

  if (hasPersianLetter(trimmed) && !/\p{Extended_Pictographic}/u.test(trimmed)) {
    return trimmed;
  }

  const parts = splitGraphemes(trimmed).filter((part) => part.trim().length > 0);
  if (parts.length === 0) return '';

  if (parts.every((part) => part === '🔴' || part === '⚪' || stripEmojiTone(part) === '🔴' || stripEmojiTone(part) === '⚪')) {
    return tenFrameCount(parts);
  }

  if (looksLikeFingerCount(parts)) {
    if (parts.length === 1 && (parts[0] === '✋' || stripEmojiTone(parts[0] ?? '') === '✋') && !peersSuggestFingers(peers)) {
      return 'دست';
    }
    return numberWord(fingerTotal(parts));
  }

  if (parts.length === 1 && parts[0] && parts[0] in DICE_PIPS) {
    return numberWord(DICE_PIPS[parts[0]] ?? 0);
  }

  if (parts.length === 1) {
    const single = parts[0] ?? '';
    if (COUNTER_EMOJI.has(single) || COUNTER_EMOJI.has(stripEmojiTone(single))) {
      return numberWord(1);
    }
    if (single === '📦') {
      return peersSuggestTens(peers) ? numberWord(10) : 'بسته';
    }
    return emojiWord(single) ?? '';
  }

  return repeatedEmojiSpeech(parts, peers);
}

export function playOptionAudio(token: string, peers: string[] = []): Promise<void> {
  const spoken = spokenOption(token, peers);
  if (!spoken) return Promise.resolve();
  return playAudio(spoken);
}
