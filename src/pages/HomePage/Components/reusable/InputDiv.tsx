import React, { forwardRef } from "react";
import clsx from "clsx";

export interface InputDivProps {
  id: string;
  label?: string;
  type?:
    | "text"
    | "number"
    | "email"
    | "password"
    | "textarea"
    | "date"
    | "time"
    | "tel";
  value?: string | number;
  placeholder?: string;
  onChange:
    | ((name: string, value: string | number) => void)
    | React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>
    | (() => void);
  onBlur?: React.FocusEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  >;
  onWheel?: React.WheelEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  >;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  disabled?: boolean;
  error?: string;
  required?: boolean;

  min?: string;
  max?: string;
  pattern?: string;
  autoComplete?: string;

  className?: string;
  inputClassName?: string;
  inputClass?: string;

  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

export const InputDiv = forwardRef<HTMLDivElement, InputDivProps>(
  (
    {
      id,
      label,
      type = "text",
      value,
      placeholder,
      onChange,
      onBlur,
      onWheel,
      onClick,
      disabled,
      error,
      required,
      min,
      max,
      pattern,
      autoComplete = "off",
      className,
      inputClassName,
      inputClass,
      ariaLabel,
      ariaLabelledBy,
      ariaDescribedBy,
      "aria-label": ariaLabelProp,
      "aria-labelledby": ariaLabelledByProp,
      "aria-describedby": ariaDescribedByProp,
    },
    ref
  ) => {
    const isTextarea = type === "textarea";
    const normalizedValue = value ?? "";

    const baseInputStyles =
      "w-full rounded-lg border bg-white px-3 py-2 text-sm " +
      "transition-colors focus:outline-none focus:ring-2";

    const stateStyles = clsx(
      error
        ? "border-error focus:ring-error/30"
        : "border-gray-300 focus:border-primary focus:ring-primary/20",
      disabled && "bg-gray-100 text-gray-500 cursor-not-allowed"
    );

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      if (onChange.length >= 2) {
        (onChange as (name: string, value: string | number) => void)(
          e.target.name,
          e.target.value
        );
        return;
      }
      (onChange as React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>)(e);
    };

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={clsx(
          "flex flex-col gap-1 text-primary",
          onClick && "cursor-pointer",
          className
        )}
      >
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-gray-700"
          >
            {label}
            {required && (
              <span className="ml-0.5 text-error">*</span>
            )}
          </label>
        )}

        {isTextarea ? (
          <textarea
            id={id}
            name={id}
            value={normalizedValue}
            placeholder={placeholder}
            disabled={disabled}
            onChange={handleChange}
            onBlur={onBlur}
            onWheel={onWheel}
            aria-label={ariaLabelProp ?? ariaLabel}
            aria-labelledby={ariaLabelledByProp ?? ariaLabelledBy}
            aria-describedby={ariaDescribedByProp ?? ariaDescribedBy}
            className={clsx(
              baseInputStyles,
              stateStyles,
              "min-h-[140px] resize-none",
              inputClassName ?? inputClass
            )}
          />
        ) : (
          <input
            id={id}
            name={id}
            type={type}
            value={normalizedValue}
            placeholder={placeholder}
            disabled={disabled}
            onChange={handleChange}
            onBlur={onBlur}
            onWheel={onWheel}
            min={min}
            max={max}
            pattern={pattern}
            autoComplete={autoComplete}
            aria-label={ariaLabelProp ?? ariaLabel}
            aria-labelledby={ariaLabelledByProp ?? ariaLabelledBy}
            aria-describedby={ariaDescribedByProp ?? ariaDescribedBy}
            className={clsx(
              baseInputStyles,
              stateStyles,
              inputClassName ?? inputClass
            )}
          />
        )}

        {error && (
          <span className="text-xs text-error">
            {error}
          </span>
        )}
      </div>
    );
  }
);

InputDiv.displayName = "InputDiv";
