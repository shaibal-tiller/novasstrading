"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "@/lib/utils";

type LazyVideoProps = {
  /** Path under /public, e.g. "/assets/vid-01.mp4" */
  src: string;
  /** Poster image path under /public */
  poster?: string;
  label: string;
  className?: string;
};

/**
 * Deferred, in-view video playback:
 * - preload="none" + poster — nothing downloads until the video scrolls near
 * - plays only while visible, pauses off-screen (saves battery/bandwidth)
 * - honours prefers-reduced-motion by never autoplaying
 */
export function LazyVideo({ src, poster, label, className }: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.15 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={clsx(
        "transition-opacity duration-700 ease-in-out",
        isLoaded || poster ? "opacity-100" : "opacity-0",
        className,
      )}
      src={src}
      poster={poster}
      preload="none"
      muted
      loop
      playsInline
      aria-label={label}
      onLoadedData={() => setIsLoaded(true)}
    />
  );
}
