"use client";

import type { ButtonHTMLAttributes } from "react";

/** A submit button that asks "are you sure?" first; Cancel stops the form from being sent. */
export function ConfirmButton({
  message,
  onClick,
  ...props
}: { message: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented && !window.confirm(message)) e.preventDefault();
      }}
    />
  );
}
