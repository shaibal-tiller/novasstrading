"use client";

import { useEffect, useState } from "react";

type ConnectionLike = {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: "change", cb: () => void) => void;
  removeEventListener?: (type: "change", cb: () => void) => void;
};

/**
 * True when the visitor has asked to save data, or the browser reports a 3G-or-worse
 * connection. (Network Information API: supported in Chromium browsers; where it is
 * missing - Safari, Firefox - visitors simply get the normal experience.)
 */
export function isSlowConnection(c?: Pick<ConnectionLike, "saveData" | "effectiveType"> | null): boolean {
  if (!c) return false;
  return c.saveData === true || c.effectiveType === "slow-2g" || c.effectiveType === "2g" || c.effectiveType === "3g";
}

/**
 * `ready` is false during server rendering and the first client render, so the static HTML
 * (and the first hydration) never depends on the visitor's connection; `slow` is only
 * meaningful once `ready`.
 */
export function useConnectionQuality(): { ready: boolean; slow: boolean } {
  const [state, setState] = useState({ ready: false, slow: false });

  useEffect(() => {
    const conn = (navigator as unknown as { connection?: ConnectionLike }).connection;
    const update = () => setState({ ready: true, slow: isSlowConnection(conn) });
    update();
    conn?.addEventListener?.("change", update);
    return () => conn?.removeEventListener?.("change", update);
  }, []);

  return state;
}
