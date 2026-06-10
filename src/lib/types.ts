/**
 * Core domain types. The vocabulary here is the source of truth — see CONTEXT.md.
 */

export type Difficulty = "Easy" | "Medium" | "Hard";

export const TOPICS = [
  "Arrays & Hashing",
  "Two Pointers",
  "Sliding Window",
  "Stack",
  "Binary Search",
  "Linked List",
  "Trees",
  "Tries",
  "Heap / Priority Queue",
  "Backtracking",
  "Graphs",
  "Advanced Graphs",
  "1-D Dynamic Programming",
  "2-D Dynamic Programming",
  "Greedy",
  "Intervals",
  "Math & Geometry",
  "Bit Manipulation",
] as const;

export type Topic = (typeof TOPICS)[number];

export type Problem = {
  id: string;
  title: string;
  topic: Topic;
  difficulty: Difficulty;
  leetcodeUrl: string;
  neetcodeUrl?: string;
  patterns?: string[];
};

export type Rating = "again" | "hard" | "good" | "easy";

export type AttemptSource = "due" | "drill" | "single" | "weak-spot";

export const LANGUAGES = [
  "python",
  "javascript",
  "typescript",
  "cpp",
  "java",
  "go",
  "rust",
] as const;

export type Language = (typeof LANGUAGES)[number];

export type Attempt = {
  /** Full ISO timestamp of the rating click. */
  date: string;
  /** The user's true clicked rating. */
  rating: Rating;
  source: AttemptSource;
  /** Set by sessionEngine when the rating was capped during a same-Session recovery. */
  recoveredCappedAt?: Rating;
  timeMin?: number;
  solvedUnaided: boolean;
  notes?: string;
  code?: string;
  language?: Language;
};

export type Box = 0 | 1 | 2 | 3 | 4 | 5;

export type ProblemProgress = {
  id: string;
  box: Box;
  /** Full ISO timestamp; "due" iff parseISO(nextDue) <= now. null = never seen. */
  nextDue: string | null;
  attempts: Attempt[];
  suspended: boolean;
  tags: string[];
};

export type Status =
  | "new"
  | "learning"
  | "reviewing"
  | "mastered"
  | "suspended";

export type Settings = {
  /** Cap on new Problems introduced per day. */
  dailyNewLimit: number;
  theme: "light" | "dark" | "system";
  defaultLanguage: Language;
  /**
   * If false, drill-mode hard/good/easy ratings log an Attempt without
   * advancing the scheduler. `again` always advances regardless.
   */
  drillUpdatesSr: boolean;
  /**
   * If true, picking a rating (click or 1-4 key) saves immediately and
   * advances to the next Problem. Undo remains available for a few seconds.
   */
  instantRating: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  dailyNewLimit: 3,
  theme: "system",
  defaultLanguage: "python",
  drillUpdatesSr: true,
  instantRating: false,
};

export const STORAGE_KEY = "grindspace:v1";

export type Store = {
  version: 1;
  progress: Record<string, ProblemProgress>;
  settings: Settings;
};

export type ProblemId = string;

/** Box -> interval (in days) used after an Attempt that lands in that box. */
export const INTERVALS_DAYS: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 16,
  5: 35,
};

/** Long-interval re-test for mastered Problems. */
export const MASTERY_REFRESH_DAYS = 90;
