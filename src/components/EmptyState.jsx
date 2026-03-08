import PropTypes from "prop-types";
import emptyIllustration from "/src/assets/emptyState.svg";
import { cn } from "@/utils/cn";

const SCOPE_CONFIG = {
  page: {
    label: "Page Empty",
    title: "Nothing here yet",
    description:
      "This page does not have content yet. Add or sync data to bring it to life.",
    rootClass:
      "mx-auto my-6 w-full max-w-4xl rounded-3xl border border-lightGray bg-gradient-to-br from-white via-inputBackground/80 to-lightGray/20 px-6 py-10 shadow-sm sm:px-10",
    layoutClass: "flex flex-col items-center text-center",
    mediaClass:
      "h-32 w-32 rounded-3xl border border-lightGray/70 bg-white p-4 shadow-sm sm:h-36 sm:w-36",
    imageClass: "h-full w-full object-contain animate-float",
    titleClass: "mt-6 text-2xl font-semibold text-primary",
    descriptionClass: "mx-auto mt-2 max-w-2xl text-sm text-primaryGray sm:text-base",
  },
  section: {
    label: "Section Empty",
    title: "No records found",
    description: "This section is currently empty. Update your filters or add new data.",
    rootClass:
      "mx-auto w-full rounded-2xl border border-dashed border-lightGray bg-gradient-to-r from-white via-inputBackground/70 to-lightGray/20 px-5 py-6 sm:px-6",
    layoutClass:
      "flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left",
    mediaClass:
      "h-20 w-20 rounded-2xl border border-lightGray/70 bg-white p-3 shadow-sm",
    imageClass: "h-full w-full object-contain",
    titleClass: "text-lg font-semibold text-primary",
    descriptionClass: "mt-1 text-sm text-primaryGray",
  },
};

const EmptyState = ({
  scope = "section",
  title,
  msg,
  description,
  actionLabel,
  onAction,
  className,
  showIllustration = true,
}) => {
  const resolvedScope = scope === "page" ? "page" : "section";
  const currentScope = SCOPE_CONFIG[resolvedScope];
  const resolvedTitle = title || msg || currentScope.title;
  const resolvedDescription = description || currentScope.description;

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden",
        currentScope.rootClass,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute -top-20 -right-16 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-secondary/10 blur-3xl" />

      <div className={cn("relative z-10", currentScope.layoutClass)}>
        {showIllustration && (
          <div className={currentScope.mediaClass}>
            <img
              src={emptyIllustration}
              alt="Empty state illustration"
              className={currentScope.imageClass}
            />
          </div>
        )}

        <div className={cn("space-y-1", resolvedScope === "page" && "max-w-2xl")}>
          <p className="inline-flex rounded-full border border-primary/10 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary/70">
            {currentScope.label}
          </p>
          <h2 className={currentScope.titleClass}>{resolvedTitle}</h2>
          <p className={currentScope.descriptionClass}>{resolvedDescription}</p>

          {actionLabel && typeof onAction === "function" && (
            <button
              type="button"
              onClick={onAction}
              className="mt-3 inline-flex rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-lighter"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

EmptyState.propTypes = {
  scope: PropTypes.oneOf(["page", "section"]),
  title: PropTypes.string,
  msg: PropTypes.string,
  description: PropTypes.string,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  className: PropTypes.string,
  showIllustration: PropTypes.bool,
};

export default EmptyState;
