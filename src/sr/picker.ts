import { differenceInCalendarDays, parseISO } from "date-fns";
import { getStatus, isMastered } from "@/lib/status";
import type { Box, Problem, ProblemProgress, Topic } from "@/lib/types";

/**
 * Returns the Problem id that the "Random weak spot" button should jump to,
 * or null when the user has no non-mastered Problems left.
 *
 * Algorithm:
 *  1. For each Topic, mastery = mastered / total. Skip 100% topics.
 *  2. Pick the topic with the lowest mastery (tiebreak: most `again`
 *     ratings overall).
 *  3. Within that topic, score each non-suspended, non-mastered Problem and
 *     return the highest score. A small jitter prevents always picking the
 *     same Problem.
 */
export function pickWeakSpot(input: {
  problems: Problem[];
  progressById: Record<string, ProblemProgress>;
  now: Date;
  /** Optional rng for testability. Default: Math.random. */
  rng?: () => number;
}): string | null {
  const { problems, progressById, now, rng = Math.random } = input;
  const byTopic = groupByTopic(problems);

  const topicStats = [...byTopic.entries()].map(([topic, ps]) => {
    let mastered = 0;
    let againTotal = 0;
    for (const p of ps) {
      const prog = progressById[p.id];
      if (prog) {
        if (isMastered(prog)) mastered++;
        againTotal += prog.attempts.filter((a) => a.rating === "again").length;
      }
    }
    return {
      topic,
      total: ps.length,
      mastered,
      againTotal,
      masteryPct: mastered / ps.length,
    };
  });

  const candidates = topicStats.filter((t) => t.masteryPct < 1);
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (a.masteryPct !== b.masteryPct) return a.masteryPct - b.masteryPct;
    return b.againTotal - a.againTotal;
  });

  const picked = candidates[0];
  if (!picked) return null;
  const topicProblems = byTopic.get(picked.topic) ?? [];

  type Scored = { id: string; score: number };
  const scored: Scored[] = [];
  for (const p of topicProblems) {
    const prog = progressById[p.id];
    if (prog?.suspended) continue;
    if (prog && isMastered(prog)) continue;
    const againCount =
      prog?.attempts.filter((a) => a.rating === "again").length ?? 0;
    const difficultyBonus =
      p.difficulty === "Hard" ? 2 : p.difficulty === "Medium" ? 1 : 0;
    const overdueDays =
      prog?.nextDue != null
        ? Math.max(0, differenceInCalendarDays(now, parseISO(prog.nextDue)))
        : 0;
    const score =
      againCount * 3 + difficultyBonus + overdueDays * 0.5 + rng() * 0.01;
    scored.push({ id: p.id, score });
  }

  if (scored.length === 0) return null;
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.id ?? null;
}

function groupByTopic(problems: Problem[]): Map<Topic, Problem[]> {
  const map = new Map<Topic, Problem[]>();
  for (const p of problems) {
    const arr = map.get(p.topic) ?? [];
    arr.push(p);
    map.set(p.topic, arr);
  }
  return map;
}

/**
 * Computes the drill queue for a Topic: non-suspended, non-mastered Problems,
 * ordered box ASC then daysSinceLastAttempt DESC (weakest first; ties broken
 * by longest-since-last-attempt). New (box-0) Problems sort first.
 */
export function buildDrillQueue(input: {
  topic: Topic;
  problems: Problem[];
  progressById: Record<string, ProblemProgress>;
  now: Date;
}): string[] {
  const { topic, problems, progressById, now } = input;
  type Row = { id: string; box: Box; daysSinceLast: number };
  const rows: Row[] = [];
  for (const p of problems) {
    if (p.topic !== topic) continue;
    const prog = progressById[p.id];
    if (prog?.suspended) continue;
    if (prog && isMastered(prog)) continue;
    const box: Box = prog?.box ?? 0;
    const lastAttempt = prog?.attempts[prog.attempts.length - 1];
    const daysSinceLast = lastAttempt
      ? differenceInCalendarDays(now, parseISO(lastAttempt.date))
      : Number.MAX_SAFE_INTEGER;
    rows.push({ id: p.id, box, daysSinceLast });
  }
  rows.sort((a, b) => {
    if (a.box !== b.box) return a.box - b.box;
    return b.daysSinceLast - a.daysSinceLast;
  });
  return rows.map((r) => r.id);
}

/** Computes today's due Problem ids, ordered by oldest nextDue first. */
export function buildDueQueue(input: {
  problems: Problem[];
  progressById: Record<string, ProblemProgress>;
  now: Date;
}): string[] {
  const { problems, progressById, now } = input;
  type Row = { id: string; dueAt: number };
  const rows: Row[] = [];
  for (const p of problems) {
    const prog = progressById[p.id];
    if (!prog || prog.suspended || prog.nextDue == null) continue;
    const due = parseISO(prog.nextDue);
    if (due.getTime() > now.getTime()) continue;
    rows.push({ id: p.id, dueAt: due.getTime() });
  }
  rows.sort((a, b) => a.dueAt - b.dueAt);
  return rows.map((r) => r.id);
}

/** Returns up to `limit` unseen Problem ids (Problems the user has never attempted). */
export function buildNewQueue(input: {
  problems: Problem[];
  progressById: Record<string, ProblemProgress>;
  limit: number;
}): string[] {
  const { problems, progressById, limit } = input;
  const out: string[] = [];
  for (const p of problems) {
    if (out.length >= limit) break;
    const prog = progressById[p.id];
    if (prog && getStatus(prog) !== "new") continue;
    out.push(p.id);
  }
  return out;
}
