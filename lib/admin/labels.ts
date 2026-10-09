import { SECTION_REGISTRY } from "@/lib/admin/section-registry";

const LISTS = new Map(SECTION_REGISTRY.flatMap((e) => e.lists.map((l) => [l.listKey, l] as const)));

/** Reads a field as short plain text, or "" if it is missing / not text. */
function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(String).join(", ").trim();
  return "";
}

function shorten(s: string, max = 80): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

/**
 * Plain-words description of a trashed item: what kind of thing it was (the list's label, such as
 * "Reasons" or "Portfolio photos") and its name, with a fallback when it has no title or caption.
 */
export function describeTrashed(section: string, fields: Record<string, unknown>): { kind: string; name: string } {
  const list = LISTS.get(section);
  const kind = list?.label ?? "Item";
  const isPhoto = section === "portfolio.photos";
  const candidates = [
    isPhoto ? fields.caption : undefined,
    list ? fields[list.titleField] : undefined,
    fields.title,
    fields.name,
    fields.caption,
    fields.alt,
    fields.label,
    fields.text,
  ];
  const name = candidates.map(text).find(Boolean);
  if (name) return { kind, name: shorten(name) };
  return { kind, name: isPhoto || typeof fields.src === "string" ? "Photo (no caption)" : "Untitled item" };
}
