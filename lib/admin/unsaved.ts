// Tiny shared flag for "the editor has changes nobody has confirmed yet". The editor sets it; links
// elsewhere on the page (header tabs, "← All sections") ask before navigating away from it.

let dirty = false;
let onLeave: (() => void) | null = null;

/** Called by the editor whenever its unconfirmed-changes state changes. `leaveCleanup` runs if the person chooses to leave anyway. */
export function setUnsaved(next: boolean, leaveCleanup: (() => void) | null = null): void {
  dirty = next;
  onLeave = next ? leaveCleanup : null;
}

export const UNSAVED_MESSAGE = "You have unsaved changes. Leave anyway?";

/** True when it is fine to navigate away (nothing unsaved, or the person agreed to lose it). */
export function confirmLeave(): boolean {
  if (!dirty) return true;
  if (!window.confirm(UNSAVED_MESSAGE)) return false;
  onLeave?.();
  return true;
}
