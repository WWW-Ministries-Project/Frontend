import { ChangeEvent, ReactNode, useRef } from "react";
import { useField } from "formik";

import {
  Field,
  SelectInput,
  TextInput,
  UiButton,
  type SelectOption,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { showNotification } from "@/pages/HomePage/utils";
import { cn } from "@/utils/cn";
import { formatInputDate, getInitials } from "@/utils/helperFunctions";
import { validateUploadFile } from "@/utils/uploadValidation";

import { ChoiceOption, TODAY, useCountries, useFieldError } from "./formUtils";


/* -------------------------------------------------------------------------- */
/*                                   Layout                                   */
/* -------------------------------------------------------------------------- */

export const FormGroup = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-1">
      <h2 className="text-xl font-bold leading-7 text-gray-800">{title}</h2>
      {description && <p className="text-sm text-gray-600">{description}</p>}
    </div>
    <FieldGrid>{children}</FieldGrid>
  </div>
);

export const FieldGrid = ({
  children,
  min = 260,
}: {
  children: ReactNode;
  min?: 200 | 220 | 260;
}) => (
  <div
    className={cn(
      "grid gap-4",
      min === 260 && "grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))]",
      min === 220 && "grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))]",
      min === 200 && "grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))]"
    )}
  >
    {children}
  </div>
);


/* -------------------------------------------------------------------------- */
/*                                Basic fields                                */
/* -------------------------------------------------------------------------- */

interface BaseFieldProps {
  name: string;
  label: string;
  disabled?: boolean;
  full?: boolean;
  className?: string;
}

export const FormTextField = ({
  name,
  label,
  type = "text",
  placeholder,
  disabled,
  full,
  className,
  max,
}: BaseFieldProps & { type?: string; placeholder?: string; max?: string }) => {
  const [field] = useField<string | undefined>(name);
  const error = useFieldError(name);
  const rawValue = field.value ?? "";
  const value = type === "date" ? formatInputDate(rawValue) || "" : rawValue;

  return (
    <Field
      label={label}
      error={error}
      className={cn(full && "col-span-full", className)}
    >
      <TextInput
        {...field}
        id={name}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        max={type === "date" ? max ?? TODAY : max}
        hasError={Boolean(error)}
        aria-invalid={Boolean(error)}
      />
    </Field>
  );
};

export const FormSelectField = ({
  name,
  label,
  options,
  placeholder = "Select",
  disabled,
  full,
  className,
}: BaseFieldProps & { options: SelectOption[]; placeholder?: string }) => {
  const [field] = useField<string | undefined>(name);
  const error = useFieldError(name);
  const value = field.value ?? "";
  const hasValue = options.some((option) => option.value === value);

  return (
    <Field
      label={label}
      error={error}
      className={cn(full && "col-span-full", className)}
    >
      <SelectInput
        {...field}
        id={name}
        value={value}
        disabled={disabled}
        hasError={Boolean(error)}
        aria-invalid={Boolean(error)}
        options={[
          { value: "", label: placeholder },
          // Keep an unknown stored value selectable instead of silently blanking it.
          ...(value && !hasValue ? [{ value, label: value }] : []),
          ...options,
        ]}
      />
    </Field>
  );
};

/* -------------------------------------------------------------------------- */
/*                               Radio-card choice                            */
/* -------------------------------------------------------------------------- */

export const ChoiceCards = <T extends string | boolean>({
  name,
  label,
  hint,
  options,
  disabled,
}: {
  name: string;
  label: string;
  hint?: string;
  options: ChoiceOption<T>[];
  disabled?: boolean;
}) => {
  const [field, , helpers] = useField<T>(name);
  const error = useFieldError(name);

  return (
    <div role="radiogroup" aria-label={label} className="col-span-full flex flex-col gap-1">
      <span className="text-sm text-primary">{label}</span>
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = field.value === option.value;
          return (
            <button
              key={String(option.value)}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => helpers.setValue(option.value)}
              className={cn(
                "flex min-h-10 flex-[1_1_160px] items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm text-primary transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                selected
                  ? "border-primary bg-primary/[0.04] font-semibold"
                  : "border-lightGray bg-white font-normal hover:bg-primary/[0.02]"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "h-4 w-4 flex-shrink-0 rounded-full bg-white",
                  selected ? "border-[5px] border-primary" : "border border-gray-400"
                )}
              />
              {option.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
};


/* -------------------------------------------------------------------------- */
/*                                  Countries                                 */
/* -------------------------------------------------------------------------- */

export const CountrySelectField = (
  props: BaseFieldProps & { placeholder?: string }
) => {
  const { countries } = useCountries();
  return <FormSelectField {...props} options={countries} />;
};

/* -------------------------------------------------------------------------- */
/*                                Phone number                                */
/* -------------------------------------------------------------------------- */

export { PhoneField, OtherNumberField } from "@/components/subform/PhoneField";

/* -------------------------------------------------------------------------- */
/*                                Photo upload                                */
/* -------------------------------------------------------------------------- */

export const PhotoField = ({
  name,
  initialsFrom,
  disabled,
}: {
  name: string;
  initialsFrom: string;
  disabled?: boolean;
}) => {
  const [field, , helpers] = useField<{ src: string; picture: File | null }>(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const src = field.value?.src;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const picture = event.currentTarget.files?.[0];
    if (!picture) return;

    const validation = validateUploadFile(picture, {
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    });

    if (!validation.valid) {
      showNotification(
        validation.message || "Invalid profile image selected.",
        "error",
        "Profile image"
      );
      event.currentTarget.value = "";
      return;
    }

    helpers.setValue({ picture, src: URL.createObjectURL(picture) });
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-lightGray bg-lightGray text-2xl font-bold text-primary/70">
        {src ? (
          <img src={src} alt="Profile" className="h-full w-full object-cover" />
        ) : initialsFrom.trim() ? (
          getInitials(initialsFrom)
        ) : (
          "+"
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleChange}
          disabled={disabled}
        />
        <UiButton
          className="self-start"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {src ? "Change photo" : "Upload photo"}
        </UiButton>
        <p className="text-sm text-gray-600">JPG or PNG, square works best.</p>
      </div>
    </div>
  );
};
