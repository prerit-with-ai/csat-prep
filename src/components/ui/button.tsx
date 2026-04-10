import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    backgroundColor: "var(--text-primary)",
    color: "var(--bg-primary)",
    border: "1px solid transparent",
  },
  secondary: {
    backgroundColor: "transparent",
    color: "var(--text-primary)",
    border: "1px solid var(--border-default)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid transparent",
  },
  danger: {
    backgroundColor: "transparent",
    color: "var(--color-wrong)",
    border: "1px solid var(--color-wrong)",
  },
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-opacity disabled:opacity-50 cursor-pointer ${sizeClasses[size]} ${className}`}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    />
  );
}
