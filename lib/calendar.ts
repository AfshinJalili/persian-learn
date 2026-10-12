import type { UserProgress } from './types';

export function dateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayDateString(now = new Date()): string {
  return dateString(now);
}

export function parseDateOnly(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year || 1970, (month || 1) - 1, day || 1);
}

export function addDays(iso: string, days: number): string {
  const date = parseDateOnly(iso);
  date.setDate(date.getDate() + days);
  return dateString(date);
}

export function diffDays(fromIso: string, toIso: string): number {
  const from = parseDateOnly(fromIso).getTime();
  const to = parseDateOnly(toIso).getTime();
  return Math.round((to - from) / 86400000);
}

export function persianWeekStart(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceSaturday = (start.getDay() + 1) % 7;
  start.setDate(start.getDate() - daysSinceSaturday);
  return start;
}

export function isSamePersianWeek(a: string, b: string): boolean {
  if (!a || !b) {
    return false;
  }
  return persianWeekStart(parseDateOnly(a)).getTime() === persianWeekStart(parseDateOnly(b)).getTime();
}

export function collectedActivityDates(progress: UserProgress): string[] {
  if (progress.activityDates && progress.activityDates.length > 0) {
    return [...new Set(progress.activityDates)];
  }
  if (!progress.lastActivityDate) {
    return [];
  }
  const dates: string[] = [];
  const last = parseDateOnly(progress.lastActivityDate);
  const count = Math.max(1, progress.streak);
  for (let i = 0; i < count; i += 1) {
    const day = new Date(last);
    day.setDate(last.getDate() - i);
    dates.push(dateString(day));
  }
  return dates;
}

export function daysThisWeek(progress: UserProgress, now = new Date()): number {
  const today = todayDateString(now);
  return collectedActivityDates(progress).filter((iso) => isSamePersianWeek(iso, today)).length;
}

export function isActiveOnWeekday(progress: UserProgress, weekdayIndex: number, now = new Date()): boolean {
  const weekStart = persianWeekStart(now);
  const iso = dateString(
    new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + weekdayIndex)
  );
  return collectedActivityDates(progress).includes(iso);
}
