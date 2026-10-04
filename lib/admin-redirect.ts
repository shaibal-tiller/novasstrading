import type { AdminModule } from "@/lib/admin-session";

/**
 * Only same-site admin paths are allowed as a post-login destination, so a
 * crafted ?next= cannot bounce someone off to another site.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (typeof next !== "string") return "/admin";
  if (!next.startsWith("/admin") || next.startsWith("//") || next.includes("\\")) return "/admin";
  // "/admin" must be a whole path segment: allow "/admin", "/admin/...", "/admin?..." — not "/administrator".
  const rest = next.slice("/admin".length);
  if (rest !== "" && !/^[/?#]/.test(rest)) return "/admin";
  return next;
}

/** If the user typed no "@", treat it as a company mailbox name. */
export function normalizeAdminEmail(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  return trimmed.includes("@") ? trimmed : `${trimmed}@novasstrading.com`;
}

export const MODULE_LINKS: Record<AdminModule, { href: string; label: string; blurb: string }> = {
  website: { href: "/admin/content", label: "Website", blurb: "Edit the public site's text, photos and lists." },
  assets: { href: "/admin/inventory/assets", label: "Assets", blurb: "Track company equipment and who has it." },
};

/** Website first: it is the default door. */
const MODULE_ORDER: readonly AdminModule[] = ["website", "assets"];

export type ChooserDecision =
  | { kind: "redirect"; href: string }
  | { kind: "choose"; modules: AdminModule[] }
  | { kind: "none" };

/** What /admin should do for a signed-in user with these modules. */
export function chooserDecision(modules: readonly AdminModule[]): ChooserDecision {
  const ordered = MODULE_ORDER.filter((m) => modules.includes(m));
  if (ordered.length === 0) return { kind: "none" };
  if (ordered.length === 1) return { kind: "redirect", href: MODULE_LINKS[ordered[0]].href };
  return { kind: "choose", modules: ordered };
}
