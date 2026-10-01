/** Data-cache tag for everything the public site reads from the content API. */
export const CONTENT_TAG = "site-content";

/** Safety net: even if an explicit revalidation is ever missed, content is at most this stale. */
export const CONTENT_REVALIDATE_SECONDS = 3600;
