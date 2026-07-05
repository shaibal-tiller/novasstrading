import { clsx } from "@/lib/utils";

// Curated dot palette — quiet, textile-toned versions of the template's
// playful multi-colour dots.
const DOTS = [
  "#B08A4F", // brass
  "#2C6B66", // loom teal
  "#C0734A", // terracotta
  "#8FA06A", // sage
  "#5B7BB0", // indigo
  "#C99BB0", // dusty rose
];

type PillListProps = {
  items: readonly string[];
  /** rotated vertical caption shown to the left of the stack */
  label?: string;
  /** stagger each pill horizontally like the template */
  stagger?: boolean;
  className?: string;
};

export function PillList({
  items,
  label,
  stagger = false,
  className,
}: PillListProps) {
  return (
    <div className={clsx("flex items-stretch gap-4", className)}>
      {label && (
        <div className="flex items-center">
          <span aria-hidden className="vlabel border-l border-dashed border-ink/30 pl-2">
            {label}
          </span>
        </div>
      )}
      <ul className="flex flex-col gap-3">
        {items.map((item, i) => (
          <li
            key={item}
            style={
              stagger
                ? { marginLeft: `${(i % 3) * 0.9}rem` }
                : undefined
            }
          >
            <span className="pill">
              <span
                className="pill-dot"
                style={{ backgroundColor: DOTS[i % DOTS.length] }}
                aria-hidden
              />
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
