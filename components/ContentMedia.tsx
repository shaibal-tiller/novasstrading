"use client";

import { clsx } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";
import { blurData } from "@/lib/blurData";
import { LazyVideo } from "./LazyVideo";
import { resolveMediaUrl } from "@/lib/media-url";

type ContentMediaProps = {
  /** Filename in /public/assets — bare names default to .png */
  src: string;
  /** Descriptive alt text for SEO and accessibility */
  alt: string;
  /** "image" | "video" | "logo" */
  kind?: "image" | "video" | "logo";
  /** Tailwind aspect ratio class, e.g. "aspect-[4/5]" */
  aspect?: string;
  className?: string;
  tone?: "ivory" | "ink";
  /** How the image fills its box — "cover" crops to fill, "contain" letterboxes to show the whole image uncropped. Defaults to "cover". */
  fit?: "cover" | "contain";
  /** Whether to prioritize loading this media (disables lazy loading) */
  priority?: boolean;
  /** Responsive sizes hint — set to the rendered slot width for best srcset selection */
  sizes?: string;
  /** Poster image for videos, path relative to /public/assets */
  poster?: string;
};

export function ContentMedia({
  src,
  alt,
  kind = "image",
  aspect = "aspect-[4/3]",
  className,
  tone = "ivory",
  fit = "cover",
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
  poster,
}: ContentMediaProps) {
  const isVideo = kind === "video" || src.toLowerCase().startsWith("vid-");
  // Check if this is uploaded media (from cPanel host). resolveMediaUrl warns
  // on our behalf when NEXT_PUBLIC_MEDIA_BASE_URL is unset for a media/-prefixed src.
  const isUploadedMedia = src.startsWith("media/");
  // Bare names default to .png; paths with an extension are used as-is.
  const fileName = src.includes(".") ? src : `${src}.png`;
  // Uploaded media has no precomputed blur entry; only look up blur for local assets
  const blur = isUploadedMedia ? undefined : blurData[fileName];
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      role="img"
      aria-label={alt}
      className={clsx(
        "relative w-full overflow-hidden rounded-sm bg-stone/40",
        aspect,
        className,
      )}
    >
      {isVideo ? (
        <LazyVideo
          src={`/assets/${src.includes(".") ? src : `${src}.mp4`}`}
          poster={poster ? `/assets/${poster}` : undefined}
          label={alt}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <Image
          src={isUploadedMedia ? resolveMediaUrl(src) : `/assets/${fileName}`}
          alt={alt}
          fill
          priority={priority}
          placeholder={blur ? "blur" : "empty"}
          blurDataURL={blur}
          className={clsx(
            kind === "logo" || fit === "contain"
              ? "object-contain p-2"
              : "object-cover",
            // Blur placeholder already covers progressive display; only
            // fade in when there is no placeholder to show.
            !blur && "transition-opacity duration-700 ease-in-out",
            !blur && (isLoaded ? "opacity-100" : "opacity-0"),
          )}
          sizes={sizes}
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
}

