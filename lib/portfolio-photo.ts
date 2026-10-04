import { resolveMediaUrl } from "@/lib/media-url";

/**
 * One portfolio photo, as the public gallery and the editor both see it.
 *
 * In the database each photo is its own `portfolio.photos` item (so it can be
 * reordered, hidden, trashed and restored individually); `assembleContent`
 * folds them back into `portfolio.tabs[].photos` in exactly this shape.
 * Every field except `src` and `alt` is optional, so photos that predate the
 * controls (and the static content in lib/content.ts) keep working unchanged.
 */
export type PortfolioPhoto = {
  /** Bundled asset ("products/women/x.jpg") or uploaded media ("media/<hash>.webp"). */
  src: string;
  /** Accessible description. Old photos use "Category — caption" and the part after "— " doubles as the caption. */
  alt: string;
  /** Visible caption. Overrides the part of `alt` after "— " when set. */
  caption?: string;
  /** Spec lines shown in the lightbox (composition, GSM, ...). */
  detail?: string[];
  /** Tile size in the grid. Default "normal". */
  size?: PhotoSize;
  /** How the picture sits inside its tile. Default "center". */
  fit?: PhotoFit;
  /** "hidden" keeps the photo in the editor but off the public site. */
  visibility?: "shown" | "hidden";
  /** "new" shows a small NEW badge on the tile. */
  badge?: "none" | "new";
  /** Present only in the editor: the real DB id (or a "new-*" sentinel) used by `<Editable>`. */
  id?: number | string;
};

export const PHOTO_SIZES = ["normal", "wide", "tall", "featured"] as const;
export type PhotoSize = (typeof PHOTO_SIZES)[number];

export const PHOTO_FITS = ["center", "top", "bottom", "whole"] as const;
export type PhotoFit = (typeof PHOTO_FITS)[number];

/** Grid-cell classes per tile size (the grid is dense, so wide/tall/featured pack around normal tiles). */
export const SIZE_CLASSES: Record<PhotoSize, string> = {
  normal: "",
  wide: "col-span-2",
  tall: "row-span-2",
  featured: "col-span-2 row-span-2",
};

/** object-position / object-fit classes per framing choice. "whole" shows the full picture, uncropped. */
export const FIT_CLASSES: Record<PhotoFit, string> = {
  center: "object-cover object-center",
  top: "object-cover object-top",
  bottom: "object-cover object-bottom",
  whole: "object-contain p-2",
};

export function photoSize(p: Pick<PortfolioPhoto, "size">): PhotoSize {
  return p.size && (PHOTO_SIZES as readonly string[]).includes(p.size) ? p.size : "normal";
}

export function photoFit(p: Pick<PortfolioPhoto, "fit">): PhotoFit | undefined {
  return p.fit && (PHOTO_FITS as readonly string[]).includes(p.fit) ? p.fit : undefined;
}

export function isPhotoHidden(p: Pick<PortfolioPhoto, "visibility">): boolean {
  return p.visibility === "hidden";
}

/** The caption people see: the explicit caption, else the part of `alt` after "— ", else `alt`. */
export function photoCaption(p: Pick<PortfolioPhoto, "alt" | "caption">): string {
  const explicit = p.caption?.trim();
  if (explicit) return explicit;
  return p.alt.split("— ")[1] ?? p.alt;
}

/** Browsable URL for a photo: uploaded media lives on the cPanel host, bundled photos under /assets. */
export function photoUrl(src: string): string {
  if (src.startsWith("media/")) return resolveMediaUrl(src);
  if (src.startsWith("/") || /^https?:\/\//.test(src)) return src;
  return `/assets/${src}`;
}

/**
 * How many "single tiles" of grid area a tile occupies. Used to work out how
 * many photos fit in the folded two rows when some tiles are bigger.
 */
export function tileWeight(size: PhotoSize): number {
  switch (size) {
    case "wide":
    case "tall":
      return 2;
    case "featured":
      return 4;
    default:
      return 1;
  }
}
