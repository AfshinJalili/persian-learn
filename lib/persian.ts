export function formatPersianNumber(num: number): string {
  return new Intl.NumberFormat('fa-IR').format(num);
}

export function formatPersianDigit(digit: number): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return persianDigits[digit] ?? String(digit);
}

export function formatDisplayValue(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return formatPersianNumber(value);
  }
  return String(value ?? '');
}

export function normalizePersianText(text: string): string {
  return text.replace(/\u064A/g, '\u06CC').replace(/\u0643/g, '\u06A9');
}

export function validatePersianText(text: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (text.includes('\u064A')) {
    issues.push('Contains Arabic yeh (ي) instead of Persian yeh (ی)');
  }

  if (text.includes('\u0643')) {
    issues.push('Contains Arabic kaf (ك) instead of Persian keheh (ک)');
  }

  if (/[\u0660-\u0669]/.test(text)) {
    issues.push('Contains Arabic-Indic digits instead of Persian digits');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
