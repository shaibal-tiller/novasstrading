import { useEffect, useRef, type RefObject } from "react";

// Open dialogs, oldest first. Esc only closes the newest one (a media picker opened
// from inside an edit box closes first, then the edit box on the next Esc).
const open: symbol[] = [];

const FIRST_FIELD = "[data-autofocus], input:not([type=hidden]):not([type=file]), textarea, select";

/**
 * Behaviour every admin pop-up shares: Esc closes it (topmost only), focus moves to its first
 * field (or first action button) when it opens, and goes back to where it was when it closes.
 */
export function useDialog(ref: RefObject<HTMLElement>, onClose: (() => void) | undefined): void {
  const handler = useRef(onClose);
  handler.current = onClose;

  useEffect(() => {
    const me = Symbol("dialog");
    open.push(me);
    const previous = document.activeElement as HTMLElement | null;
    const root = ref.current;
    const target =
      root?.querySelector<HTMLElement>(FIRST_FIELD) ??
      root?.querySelector<HTMLElement>("button:not([aria-label='Close'])") ??
      root;
    target?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open[open.length - 1] === me) handler.current?.();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      open.splice(open.indexOf(me), 1);
      if (previous && document.contains(previous)) previous.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on open/close
  }, []);
}
