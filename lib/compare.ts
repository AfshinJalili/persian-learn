export type CompareAsk = 'more' | 'less';

export function compareAsk(ask: unknown): CompareAsk {
  return ask === 'less' ? 'less' : 'more';
}

export function comparePrompt(ask: unknown): string {
  const kind = compareAsk(ask);
  switch (kind) {
    case 'less':
      return 'کدام کمتر است؟';
    case 'more':
      return 'کدام بیشتر است؟';
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
