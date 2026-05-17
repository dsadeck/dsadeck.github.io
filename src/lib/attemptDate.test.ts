import { describe, expect, it } from "vitest";
import {
  formatAbsoluteAttemptDate,
  formatRelativeAttemptDate,
} from "./attemptDate";

const NOW = new Date("2024-06-10T15:00:00Z");

function iso(s: string) {
  return new Date(s).toISOString();
}

describe("formatRelativeAttemptDate", () => {
  it("shows 'Today, HH:mm' for same calendar day", () => {
    const out = formatRelativeAttemptDate(iso("2024-06-10T08:30:00Z"), NOW);
    expect(out.startsWith("Today, ")).toBe(true);
    expect(out).toMatch(/^Today, \d{2}:\d{2}$/);
  });

  it("shows 'Yesterday, HH:mm' for previous calendar day", () => {
    const out = formatRelativeAttemptDate(iso("2024-06-09T22:00:00Z"), NOW);
    expect(out.startsWith("Yesterday, ")).toBe(true);
    expect(out).toMatch(/^Yesterday, \d{2}:\d{2}$/);
  });

  it("shows 'N days ago' for 2..6 days back", () => {
    expect(formatRelativeAttemptDate(iso("2024-06-08T12:00:00Z"), NOW)).toBe(
      "2 days ago",
    );
    expect(formatRelativeAttemptDate(iso("2024-06-04T12:00:00Z"), NOW)).toBe(
      "6 days ago",
    );
  });

  it("falls back to absolute date for older than 6 days", () => {
    expect(formatRelativeAttemptDate(iso("2024-06-03T12:00:00Z"), NOW)).toBe(
      "Jun 3, 2024",
    );
    expect(formatRelativeAttemptDate(iso("2023-12-25T12:00:00Z"), NOW)).toBe(
      "Dec 25, 2023",
    );
  });

  it("handles future-dated attempts gracefully", () => {
    const out = formatRelativeAttemptDate(iso("2024-06-11T08:00:00Z"), NOW);
    expect(out.startsWith("Tomorrow, ")).toBe(true);
    expect(formatRelativeAttemptDate(iso("2024-06-15T08:00:00Z"), NOW)).toBe(
      "Jun 15, 2024",
    );
  });

  it("returns empty string for an invalid ISO", () => {
    expect(formatRelativeAttemptDate("not-a-date", NOW)).toBe("");
  });
});

describe("formatAbsoluteAttemptDate", () => {
  it("formats as 'yyyy-MM-dd HH:mm'", () => {
    const out = formatAbsoluteAttemptDate(iso("2024-06-04T14:23:00Z"));
    expect(out).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it("returns the input for an unparseable string", () => {
    expect(formatAbsoluteAttemptDate("nope")).toBe("nope");
  });
});
