"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export type EditModeContextValue = {
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  draft: unknown;
  setDraft: Dispatch<SetStateAction<unknown>>;
  /** Tells the editor a file was just uploaded (its path and media id), so Discard can clean it up. */
  rememberUpload?: (path: string, mediaId: number) => void;
};

/**
 * Exported (not just the hook) so tests can inject a mocked context value
 * directly via `<EditModeContext.Provider value={...}>` without going
 * through real state.
 */
export const EditModeContext = createContext<EditModeContextValue | null>(null);

export function EditModeProvider({
  children,
  initialDraft = null,
}: {
  children: ReactNode;
  initialDraft?: unknown;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<unknown>(initialDraft);

  return (
    <EditModeContext.Provider
      value={{ hoveredId, setHoveredId, openId, setOpenId, draft, setDraft }}
    >
      {children}
    </EditModeContext.Provider>
  );
}

/**
 * Returns the edit-mode context, or `null` when called outside a
 * provider (e.g. on the public marketing site). Never throws — this is
 * exactly what lets `Editable` be a complete no-op there.
 */
export function useEditMode(): EditModeContextValue | null {
  return useContext(EditModeContext);
}

