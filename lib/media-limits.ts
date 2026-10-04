/**
 * The one number that decides how big a stored photo may be: 1000px on the long edge.
 * Bigger originals (4K, 8K, phone panoramas) are shrunk to this - first in the browser,
 * before the upload even starts, and then again on the server as the final authority
 * (cpanel-api/src/ImageOptimizer.php: MAX_DIMENSION - keep the two in step).
 *
 * 1000px is plenty for how photos are shown (grid tiles are ~300px; the full-screen view
 * is ~600px tall) and keeps each photo to roughly 30-150 KB of the hosting plan's disk.
 */
export const MAX_PHOTO_EDGE = 1000;

/** Anything larger than this is refused outright (a non-image or something that cannot be shrunk). */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
