import { useFormikContext } from "formik";
import { useEffect, useRef } from "react";

export interface FormErrorItem {
  /** id or name of the field to focus. */
  field: string;
  message: string;
}

interface FormErrorSummaryProps {
  errors: FormErrorItem[];
  /** Change this (e.g. submit count) to move focus to the summary again. */
  focusKey?: unknown;
  className?: string;
}

const focusField = (field: string) => {
  const target =
    document.getElementById(field) ??
    document.querySelector<HTMLElement>(`[name="${CSS.escape(field)}"]`);
  if (!target) return;
  target.scrollIntoView({ block: "center", behavior: "smooth" });
  target.focus({ preventScroll: true });
};

/**
 * Shown at the top of a form after a failed submit. Lists each problem as a
 * link to its field and takes focus so screen readers announce it.
 */
export const FormErrorSummary = ({
  errors,
  focusKey,
  className,
}: FormErrorSummaryProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const hasErrors = errors.length > 0;

  useEffect(() => {
    if (hasErrors) ref.current?.focus();
  }, [focusKey, hasErrors]);

  if (!hasErrors) return null;

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className={`flex gap-3 rounded-lg border border-error/25 bg-error/5 px-4 py-3 text-sm leading-5 outline-none ${className ?? ""}`}
    >
      <span className="flex flex-shrink-0 pt-0.5 text-error" aria-hidden="true">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5.5M12 16v.5" />
        </svg>
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-primary">
          {errors.length === 1
            ? "1 field needs attention"
            : `${errors.length} fields need attention`}
        </p>
        <ul className="list-disc pl-[18px] text-gray-700">
          {errors.map((error) => (
            <li key={`${error.field}-${error.message}`}>
              <a
                href={`#${error.field}`}
                onClick={(event) => {
                  event.preventDefault();
                  focusField(error.field);
                }}
                className="text-error underline-offset-2 hover:underline"
              >
                {error.message}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const flattenErrors = (
  errors: unknown,
  prefix = ""
): FormErrorItem[] => {
  if (!errors) return [];
  if (typeof errors === "string") return [{ field: prefix, message: errors }];
  if (Array.isArray(errors)) {
    return errors.flatMap((entry, index) =>
      flattenErrors(entry, `${prefix}[${index}]`)
    );
  }
  if (typeof errors === "object") {
    return Object.entries(errors as Record<string, unknown>).flatMap(
      ([key, value]) => flattenErrors(value, prefix ? `${prefix}.${key}` : key)
    );
  }
  return [];
};

/**
 * Formik-aware summary. Renders after the first submit attempt and lists
 * the current errors, optionally limited to `fields`.
 */
export const FormikErrorSummary = ({
  fields,
  className,
}: {
  fields?: string[];
  className?: string;
}) => {
  const { errors, submitCount } = useFormikContext<Record<string, unknown>>();
  if (!submitCount) return null;

  const items = flattenErrors(errors).filter(
    (item) =>
      !fields ||
      fields.some(
        (field) =>
          item.field === field ||
          item.field.startsWith(`${field}.`) ||
          item.field.startsWith(`${field}[`)
      )
  );

  return (
    <FormErrorSummary errors={items} focusKey={submitCount} className={className} />
  );
};
