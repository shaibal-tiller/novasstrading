/**
 * Helpers for the portfolio tabs and photo descriptions in the editor.
 * Kept free of React so they can be tested on their own.
 */

/** A short, safe internal id from a tab name ("Home & Textile" -> "home-textile"), unique among `taken`. */
export function tabKeyFrom(label: string, taken: readonly string[]): string {
  const base =
    label
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30)
      .replace(/-+$/g, "") || "tab";
  if (!taken.includes(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.includes(candidate)) return candidate;
  }
}

/**
 * True when a photo description looks like a camera or file name ("IMG_4021", "DSC00123", "photo 12")
 * or is too short to help someone who cannot see the picture or a search engine.
 * `tabLabel` is stripped first, because new uploads start as "<Category> — <file name>".
 */
export function weakPhotoDescription(alt: string): boolean {
  const text = alt.includes("—") ? alt.split("—").slice(1).join("—").trim() : alt.trim();
  if (text.length < 8) return true;
  const compact = text.replace(/[\s._-]+/g, "").toLowerCase();
  if (/^(img|dsc|dscn|dscf|pxl|image|photo|picture|pic|screenshot|whatsapp|untitled|copy)?\d{2,}$/.test(compact)) return true;
  if (/^(img|dsc|dscn|dscf|pxl|image|photo|picture|pic|screenshot|whatsappimage)[\d\w-]*$/i.test(compact) && /\d{3,}/.test(compact)) return true;
  return false;
}
