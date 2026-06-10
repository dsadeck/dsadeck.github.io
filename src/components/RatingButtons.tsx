import type { Rating } from "@/lib/types";

const ORDER: Rating[] = ["again", "hard", "good", "easy"];
const LABEL: Record<Rating, string> = {
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
};
const STYLE: Record<Rating, string> = {
  again: "bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-500",
  hard: "bg-amber-500 text-white hover:bg-amber-400 focus-visible:ring-amber-500",
  good: "bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-500",
  easy: "bg-sky-600 text-white hover:bg-sky-500 focus-visible:ring-sky-500",
};
const SELECTED_RING: Record<Rating, string> = {
  again: "ring-rose-500",
  hard: "ring-amber-500",
  good: "ring-emerald-500",
  easy: "ring-sky-500",
};
const HOTKEY: Record<Rating, string> = {
  again: "1",
  hard: "2",
  good: "3",
  easy: "4",
};

export function RatingButtons({
  onRate,
  disabled,
  selected = null,
  previews,
}: {
  onRate: (rating: Rating) => void;
  disabled?: boolean;
  /** Currently chosen rating; renders a ring and dims the siblings. */
  selected?: Rating | null;
  /** Per-rating scheduling consequence, e.g. "7d", "today", "log only". */
  previews?: Record<Rating, string>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {ORDER.map((r) => {
        const isSelected = selected === r;
        const dimmed = selected !== null && !isSelected;
        return (
          <button
            key={r}
            type="button"
            className={`btn ${STYLE[r]} h-14 flex-col gap-0 text-base transition-opacity ${
              isSelected
                ? `ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 ${SELECTED_RING[r]}`
                : ""
            } ${dimmed ? "opacity-50 hover:opacity-100" : ""}`}
            onClick={() => onRate(r)}
            disabled={disabled}
            aria-pressed={isSelected}
            aria-label={
              previews
                ? `Rate ${LABEL[r]}, next review ${previews[r]}`
                : `Rate ${LABEL[r]}`
            }
          >
            <span className="flex items-baseline gap-2">
              <span>{LABEL[r]}</span>
              <span className="text-xs opacity-70">{HOTKEY[r]}</span>
            </span>
            {previews && (
              <span className="text-xs font-normal opacity-80">
                {previews[r]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
