"use client";

import { clsx } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

type ContentMediaProps = {
  /** Filename in /public/assets without extension */
  src: string;
  /** Descriptive alt text for SEO and accessibility */
  alt: string;
  /** "image" | "video" | "logo" */
  kind?: "image" | "video" | "logo";
  /** Tailwind aspect ratio class, e.g. "aspect-[4/5]" */
  aspect?: string;
  className?: string;
  tone?: "ivory" | "ink";
  /** Whether to prioritize loading this media (disables lazy loading) */
  priority?: boolean;
};

export function ContentMedia({
  src,
  alt,
  kind = "image",
  aspect = "aspect-[4/3]",
  className,
  tone = "ivory",
  priority = false,
}: ContentMediaProps) {
  const isVideo = kind === "video" || src.toLowerCase().startsWith("vid-");
  const fileName = src;
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
        <video
          src={`/assets/${fileName}.mp4`}
          className={clsx(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          autoPlay
          muted
          loop
          playsInline
          aria-label={alt}
          onLoadedData={() => setIsLoaded(true)}
        />
      ) : (
        <Image
          src={`/assets/${fileName}.png`}
          alt={alt}
          fill
          priority={priority}
          className={clsx(
            "object-cover transition-opacity duration-700 ease-in-out",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          sizes="(max-width: 768px) 100vw, 50vw"
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
}
