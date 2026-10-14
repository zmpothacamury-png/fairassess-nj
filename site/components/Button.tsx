import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const BASE =
  "focus-ring inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-blue-600 text-white hover:bg-navy-700",
  secondary: "border-2 border-blue-600 bg-white text-blue-600 hover:bg-blue-100",
  ghost: "text-blue-600 hover:bg-blue-100",
};

const SIZES: Record<Size, string> = {
  md: "min-h-12 px-4 text-sm",
  lg: "min-h-14 px-6 text-base",
};

/** Class names for a button look, for elements that can't use <Button>. */
export function buttonClasses(variant: Variant = "primary", size: Size = "md") {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]}`;
}

type CommonProps = { variant?: Variant; size?: Size; children: ReactNode; className?: string };

/**
 * Button. Pass `href` to render a link that looks like a button.
 * Variants: primary (filled blue), secondary (outlined), ghost (text only).
 * Every variant has a visible blue focus ring for keyboard users.
 */
export function Button(
  props: CommonProps &
    (({ href: string } & Omit<ComponentProps<typeof Link>, "className">) |
      ({ href?: undefined } & Omit<ComponentProps<"button">, "className">)),
) {
  const { variant = "primary", size = "md", className = "", children, ...rest } = props;
  const classes = `${buttonClasses(variant, size)} ${className}`;

  if (rest.href !== undefined) {
    return (
      <Link {...(rest as ComponentProps<typeof Link>)} className={classes}>
        {children}
      </Link>
    );
  }
  const { type = "button", ...buttonProps } = rest as ComponentProps<"button">;
  return (
    <button type={type} {...buttonProps} className={classes}>
      {children}
    </button>
  );
}
