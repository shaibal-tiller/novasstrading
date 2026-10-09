import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { CONTENT_TAG } from "@/lib/content-tag";

/**
 * Call after any admin write that changes public content. Drops the cached
 * API response (tag) so the next request refetches, and re-renders the page.
 */
export function revalidatePublicContent(): void {
  revalidateTag(CONTENT_TAG);
  revalidatePath("/");
}
