export type Topic = { id: string; title: string; done: boolean };
export type Subject = { id: string; name: string; examDate: string; topics: Topic[] };
export type Task = { id: string; date: string; time: string; title: string; done: boolean };

/** Whole days from today (local) to exam date (YYYY-MM-DD). */
export function daysLeft(examDate: string, today: Date = new Date()): number {
  const [y, m, d] = examDate.split("-").map(Number);
  const exam = Date.UTC(y, m - 1, d);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((exam - now) / 86400000);
}

export function progress(topics: Topic[]): number {
  if (topics.length === 0) return 0;
  return Math.round((topics.filter((t) => t.done).length / topics.length) * 100);
}

export function todayStr(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const uid = () => Math.random().toString(36).slice(2, 10);
