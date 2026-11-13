import type { Task, Priority } from "@/lib/tasks";

export const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];

export const PRIORITY_WEIGHT: Record<Priority, number> = { low: 1, medium: 2, high: 3, urgent: 4 };

export const PROGRESS_STEPS = [0, 25, 50, 75, 100] as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parses "YYYY-MM-DD" as a local calendar date (never shifted by time zone). */
export function parseDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toDateString(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export function todayStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(days: number): string {
  const d = todayStart();
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

/** True only for real calendar dates, e.g. rejects 2026-02-31. */
export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toDateString(parseDate(value)) === value;
}

/** Whole days from today to the due date: negative = overdue. null when no date. */
export function daysUntil(due: string | null): number | null {
  if (!due) return null;
  return Math.round((parseDate(due).getTime() - todayStart().getTime()) / MS_PER_DAY);
}

export const isDone = (task: Task) => task.progress >= 100;

export function isOverdue(task: Task): boolean {
  const days = daysUntil(task.dueDate);
  return !isDone(task) && days !== null && days < 0;
}

export function formatDue(due: string | null): string {
  const days = daysUntil(due);
  if (due === null || days === null) return "No deadline";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days === -1) return "Overdue by 1 day";
  if (days < 0) return `Overdue by ${-days} days`;
  const date = parseDate(due);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  const label = date.toLocaleDateString(undefined, {
    weekday: days < 7 ? "short" : undefined,
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
  return `Due ${label}`;
}

/** Earliest deadline first; tasks without one go last. */
function byDue(a: Task, b: Task): number {
  if (a.dueDate === b.dueDate) return 0;
  if (a.dueDate === null) return 1;
  if (b.dueDate === null) return -1;
  return a.dueDate < b.dueDate ? -1 : 1;
}

export const sortByDeadline = (tasks: Task[]) => [...tasks].sort(byDue);

/** Most important first: priority, then the nearest deadline. Finished tasks are excluded. */
export function sortByPriority(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => !isDone(t))
    .sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] || byDue(a, b));
}

export function overallPercent(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  return Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
