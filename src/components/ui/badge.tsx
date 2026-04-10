import { HTMLAttributes } from "react";

type BadgeVariant =
  | "section-rc"
  | "section-lr"
  | "section-math"
  | "level-l1"
  | "level-l2"
  | "level-l3"
  | "abc-a"
  | "abc-b"
  | "abc-c"
  | "amber"
  | "correct"
  | "wrong"
  | "default";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  "section-rc": { backgroundColor: "var(--section-rc-bg)", color: "var(--section-rc)" },
  "section-lr": { backgroundColor: "var(--section-lr-bg)", color: "var(--section-lr)" },
  "section-math": { backgroundColor: "var(--section-math-bg)", color: "var(--section-math)" },
  "level-l1": { backgroundColor: "var(--level-l1-bg)", color: "var(--level-l1)" },
  "level-l2": { backgroundColor: "var(--level-l2-bg)", color: "var(--level-l2)" },
  "level-l3": { backgroundColor: "var(--level-l3-bg)", color: "var(--level-l3)" },
  "abc-a": { backgroundColor: "var(--abc-a-bg)", color: "var(--abc-a)" },
  "abc-b": { backgroundColor: "var(--abc-b-bg)", color: "var(--abc-b)" },
  "abc-c": { backgroundColor: "var(--abc-c-bg)", color: "var(--abc-c)" },
  amber: { backgroundColor: "var(--color-amber-bg)", color: "var(--color-amber)" },
  correct: { backgroundColor: "var(--color-correct-bg)", color: "var(--color-correct)" },
  wrong: { backgroundColor: "var(--color-wrong-bg)", color: "var(--color-wrong)" },
  default: { backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" },
};

export function Badge({
  variant = "default",
  className = "",
  style,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${className}`}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    >
      {children}
    </span>
  );
}
