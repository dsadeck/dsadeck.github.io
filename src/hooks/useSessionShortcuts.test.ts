import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSessionShortcuts } from "./useSessionShortcuts";
import type { Rating } from "@/lib/types";

type Handlers = {
  onReveal: ReturnType<typeof vi.fn>;
  onSelectRating: ReturnType<typeof vi.fn>;
  onSubmit: ReturnType<typeof vi.fn>;
  onCollapse: ReturnType<typeof vi.fn>;
  onUndo: ReturnType<typeof vi.fn>;
};

function makeHandlers(): Handlers {
  return {
    onReveal: vi.fn(),
    onSelectRating: vi.fn(),
    onSubmit: vi.fn(),
    onCollapse: vi.fn(),
    onUndo: vi.fn(),
  };
}

function setup(opts: {
  enabled?: boolean;
  revealed?: boolean;
  hasRating?: boolean;
  canUndo?: boolean;
}) {
  const handlers = makeHandlers();
  const { rerender, unmount } = renderHook(
    (props: {
      enabled: boolean;
      revealed: boolean;
      hasRating: boolean;
      canUndo: boolean;
    }) =>
      useSessionShortcuts({
        ...props,
        ...handlers,
      }),
    {
      initialProps: {
        enabled: opts.enabled ?? true,
        revealed: opts.revealed ?? false,
        hasRating: opts.hasRating ?? false,
        canUndo: opts.canUndo ?? false,
      },
    },
  );
  return { handlers, rerender, unmount };
}

function press(key: string, init: KeyboardEventInit = {}, target?: EventTarget) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  (target ?? window).dispatchEvent(event);
  return event;
}

describe("useSessionShortcuts", () => {
  it("reveals on Space when collapsed", () => {
    const { handlers } = setup({ revealed: false });
    press(" ");
    expect(handlers.onReveal).toHaveBeenCalledTimes(1);
    expect(handlers.onSelectRating).not.toHaveBeenCalled();
    expect(handlers.onSubmit).not.toHaveBeenCalled();
  });

  it("does NOT reveal on Space when already revealed", () => {
    const { handlers } = setup({ revealed: true });
    press(" ");
    expect(handlers.onReveal).not.toHaveBeenCalled();
  });

  it.each<[string, Rating]>([
    ["1", "again"],
    ["2", "hard"],
    ["3", "good"],
    ["4", "easy"],
  ])("maps key %s to rating %s when revealed", (key, rating) => {
    const { handlers } = setup({ revealed: true });
    press(key);
    expect(handlers.onSelectRating).toHaveBeenCalledWith(rating);
  });

  it("ignores number keys when not revealed", () => {
    const { handlers } = setup({ revealed: false });
    press("1");
    expect(handlers.onSelectRating).not.toHaveBeenCalled();
    expect(handlers.onReveal).not.toHaveBeenCalled();
  });

  it("submits on Enter when revealed and a rating is selected", () => {
    const { handlers } = setup({ revealed: true, hasRating: true });
    press("Enter");
    expect(handlers.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("does NOT submit on Enter when no rating is selected", () => {
    const { handlers } = setup({ revealed: true, hasRating: false });
    press("Enter");
    expect(handlers.onSubmit).not.toHaveBeenCalled();
  });

  it("collapses on Escape when revealed", () => {
    const { handlers } = setup({ revealed: true, hasRating: true });
    press("Escape");
    expect(handlers.onCollapse).toHaveBeenCalledTimes(1);
  });

  it("ignores Escape when not revealed", () => {
    const { handlers } = setup({ revealed: false });
    press("Escape");
    expect(handlers.onCollapse).not.toHaveBeenCalled();
  });

  it("ignores keys originating from a textarea (except Escape)", () => {
    const { handlers } = setup({ revealed: true, hasRating: true });
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    try {
      press("1", {}, ta);
      press("Enter", {}, ta);
      expect(handlers.onSelectRating).not.toHaveBeenCalled();
      expect(handlers.onSubmit).not.toHaveBeenCalled();

      press("Escape", {}, ta);
      expect(handlers.onCollapse).toHaveBeenCalledTimes(1);
    } finally {
      document.body.removeChild(ta);
    }
  });

  it("ignores keys originating from a contentEditable element", () => {
    const { handlers } = setup({ revealed: true, hasRating: true });
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    document.body.appendChild(div);
    try {
      press("1", {}, div);
      press("Enter", {}, div);
      expect(handlers.onSelectRating).not.toHaveBeenCalled();
      expect(handlers.onSubmit).not.toHaveBeenCalled();
    } finally {
      document.body.removeChild(div);
    }
  });

  it("ignores keys with Ctrl/Meta/Alt modifiers", () => {
    const { handlers } = setup({ revealed: true, hasRating: true });
    press("1", { ctrlKey: true });
    press("1", { metaKey: true });
    press("1", { altKey: true });
    press("Enter", { metaKey: true });
    expect(handlers.onSelectRating).not.toHaveBeenCalled();
    expect(handlers.onSubmit).not.toHaveBeenCalled();
  });

  it("is a no-op when disabled", () => {
    const { handlers } = setup({ enabled: false, revealed: true, hasRating: true });
    press("1");
    press("Enter");
    press("Escape");
    expect(handlers.onSelectRating).not.toHaveBeenCalled();
    expect(handlers.onSubmit).not.toHaveBeenCalled();
    expect(handlers.onCollapse).not.toHaveBeenCalled();
  });

  it("reacts to prop changes (rerender)", () => {
    const { handlers, rerender } = setup({ revealed: false, hasRating: false });
    press("1");
    expect(handlers.onSelectRating).not.toHaveBeenCalled();

    rerender({ enabled: true, revealed: true, hasRating: false, canUndo: false });
    press("2");
    expect(handlers.onSelectRating).toHaveBeenCalledWith("hard");
  });

  it("undoes on U when an undo window is open", () => {
    const { handlers } = setup({ revealed: false, canUndo: true });
    press("u");
    expect(handlers.onUndo).toHaveBeenCalledTimes(1);
    press("U");
    expect(handlers.onUndo).toHaveBeenCalledTimes(2);
  });

  it("ignores U when there is nothing to undo", () => {
    const { handlers } = setup({ revealed: true, canUndo: false });
    press("u");
    expect(handlers.onUndo).not.toHaveBeenCalled();
  });

  it("ignores U originating from a textarea", () => {
    const { handlers } = setup({ revealed: true, canUndo: true });
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    try {
      press("u", {}, ta);
      expect(handlers.onUndo).not.toHaveBeenCalled();
    } finally {
      document.body.removeChild(ta);
    }
  });

  it("calls preventDefault on handled keys", () => {
    setup({ revealed: true, hasRating: true });
    const evt = press("1");
    expect(evt.defaultPrevented).toBe(true);
  });

  it("does not preventDefault on unhandled keys", () => {
    setup({ revealed: true, hasRating: true });
    const evt = press("a");
    expect(evt.defaultPrevented).toBe(false);
  });

  it("removes its listener on unmount", () => {
    const { handlers, unmount } = setup({ revealed: true });
    unmount();
    press("1");
    expect(handlers.onSelectRating).not.toHaveBeenCalled();
  });
});
