import type { Rating } from "@/lib/types";

const ORDER: Rating[] = ["again", "hard", "good", "easy"];
const LABEL: Record<Rating, string> = {
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
};
const STYLE: Record<Rating, string> = {
  again: "bg-rose-600 text-white hover:bg-rose-500 focus:ring-rose-500",
  hard: "bg-amber-500 text-white hover:bg-amber-400 focus:ring-amber-500",
  good: "bg-emerald-600 text-white hover:bg-emerald-500 focus:ring-emerald-500",
  easy: "bg-sky-600 text-white hover:bg-sky-500 focus:ring-sky-500",
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
}: {
  onRate: (rating: Rating) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {ORDER.map((r) => (
        <button
          key={r}
          type="button"
          className={`btn ${STYLE[r]} h-14 text-base`}
          onClick={() => onRate(r)}
          disabled={disabled}
          aria-label={`Rate ${LABEL[r]}`}
        >
          <span className="flex items-baseline gap-2">
            <span>{LABEL[r]}</span>
            <span className="text-xs opacity-70">{HOTKEY[r]}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
