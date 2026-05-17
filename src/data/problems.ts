import raw from "./problems.json";
import type { Problem, Topic } from "@/lib/types";

type Catalog = {
  version: string;
  source?: string;
  problems: Problem[];
};

const catalog = raw as Catalog;

export const CATALOG_VERSION: string = catalog.version;
export const PROBLEMS: readonly Problem[] = Object.freeze(catalog.problems);

const byIdMap = new Map<string, Problem>();
for (const p of PROBLEMS) byIdMap.set(p.id, p);

export function getProblemById(id: string): Problem | undefined {
  return byIdMap.get(id);
}

export function problemsByTopic(): Map<Topic, Problem[]> {
  const map = new Map<Topic, Problem[]>();
  for (const p of PROBLEMS) {
    const arr = map.get(p.topic) ?? [];
    arr.push(p);
    map.set(p.topic, arr);
  }
  return map;
}

export function searchProblems(query: string): Problem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...PROBLEMS];
  return PROBLEMS.filter((p) => {
    if (p.title.toLowerCase().includes(q)) return true;
    if (p.topic.toLowerCase().includes(q)) return true;
    if (p.patterns?.some((t) => t.toLowerCase().includes(q))) return true;
    return false;
  });
}
