import { ZenIcon } from "../Icon/icons";
import "./States.css";

export interface EmptyStateProps {
  title: string;
  message?: string;
  className?: string;
}

/** Quiet empty-region state (no results, empty list, etc.). */
export function EmptyState({ title, message, className }: EmptyStateProps) {
  return (
    <div className={`zs-state zs-state--empty${className ? ` ${className}` : ""}`} role="status">
      <ZenIcon name="film" size={40} className="zs-state__icon" />
      <h3 className="zs-state__title">{title}</h3>
      {message && <p className="zs-state__message">{message}</p>}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/** Failure state with an optional retry action. */
export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={`zs-state zs-state--error${className ? ` ${className}` : ""}`} role="alert">
      <ZenIcon name="alert" size={40} className="zs-state__icon" />
      <h3 className="zs-state__title">{title}</h3>
      {message && <p className="zs-state__message">{message}</p>}
      {onRetry && (
        <button type="button" className="zs-state__retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}