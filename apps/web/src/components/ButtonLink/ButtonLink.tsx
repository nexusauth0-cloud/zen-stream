import { Link } from "react-router-dom";
import type { LinkProps } from "react-router-dom";
import type { ButtonSize, ButtonVariant } from "../Button/Button";
import "../Button/Button.css";

export interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * Link styled as a Zen-Stream button. The shared button language lives in
 * Button.css; this renders an anchor (routing) with the same classes.
 * Importing Button.css here guarantees the button styling is always loaded.
 */
export function ButtonLink({ variant = "primary", size = "md", className, ...props }: ButtonLinkProps) {
  const classes = ["zs-button", `zs-button--${variant}`, `zs-button--${size}`, className]
    .filter(Boolean)
    .join(" ");

  return <Link className={classes} {...props} />;
}