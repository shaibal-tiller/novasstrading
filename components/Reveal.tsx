"use client";

import { useEffect, useRef, useState, createElement } from "react";
import type { ElementType } from "react";
import { clsx } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  as?: ElementType;
  delay?: number;
};

export function Reveal({
  children,
  className,
  as: Tag = "div",
  delay = 0,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return createElement(
    Tag,
    {
      ref,
      style: delay ? { transitionDelay: `${delay}ms` } : undefined,
      className: clsx("reveal", visible && "is-visible", className),
    },
    children,
  );
}
