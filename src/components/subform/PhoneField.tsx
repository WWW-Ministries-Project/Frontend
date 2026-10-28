import { useMemo } from "react";
import { useField } from "formik";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { string } from "yup";

import { cn } from "@/utils/cn";

import {
  Field,
  SelectInput,
  TextInput,
  type SelectOption,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import {
  useCountries,
  useFieldError,
} from "@/pages/HomePage/pages/Members/Components/form/formUtils";

export interface IContactInput {
  country_code: string;
  number: string;
}

const initialValues: IContactInput = {
  country_code: "+233",
  number: "",
};

const validationSchema = {
  number: string().required("Phone number is required"),
  country_code: string().required("Country code is required"),
};

/**
 * Country code + number pair bound to `${prefix}.phone.{country_code,number}`.
 * Keeps the libphonenumber field-level validation of the legacy ContactInput.
 */
const PhoneFieldComponent = ({
  prefix,
  label,
  disabled,
  className,
  zipClass,
  placeholder,
}: {
  prefix?: string;
  label: string;
  disabled?: boolean;
  /** Extra classes for the number input. */
  className?: string;
  /** Extra classes for the country-code select. */
  zipClass?: string;
  placeholder?: string;
}) => {
  const { dialOptions } = useCountries();
  const codeName = prefix ? `${prefix}.phone.country_code` : "phone.country_code";
  const numberName = prefix ? `${prefix}.phone.number` : "phone.number";
  const [codeField] = useField<string | undefined>(codeName);
  const code = codeField.value ?? "+233";

  const countryCode = useMemo(
    () =>
      (dialOptions.find((option) => option.dialCode === code)?.countryCode ||
        "GH") as CountryCode,
    [code, dialOptions]
  );

  const [numberField] = useField<string | undefined>({
    name: numberName,
    validate: (value: string | undefined) => {
      if (!value) return undefined;
      return parsePhoneNumberFromString(value, countryCode)?.isValid()
        ? undefined
        : "Invalid phone number for selected country";
    },
  });

  const codeError = useFieldError(codeName);
  const numberError = useFieldError(numberName);
  const error = numberError || codeError;

  const codeOptions = useMemo<SelectOption[]>(() => {
    const seen = new Set<string>();
    const options: SelectOption[] = [];
    dialOptions.forEach((option) => {
      if (seen.has(option.dialCode)) return;
      seen.add(option.dialCode);
      options.push({ value: option.dialCode, label: `${option.dialCode} ${option.name}` });
    });
    if (code && !seen.has(code)) options.unshift({ value: code, label: code });
    return options;
  }, [code, dialOptions]);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={numberName} className="text-sm text-primary">
        {label}
      </label>
      <div className="flex gap-2">
        <SelectInput
          {...codeField}
          id={codeName}
          aria-label="Country calling code"
          value={code}
          disabled={disabled}
          hasError={Boolean(codeError)}
          className={cn("w-[112px] flex-shrink-0", zipClass)}
          options={[{ value: "", label: "Code" }, ...codeOptions]}
        />
        <TextInput
          {...numberField}
          id={numberName}
          type="tel"
          value={numberField.value ?? ""}
          placeholder={placeholder ?? "Enter phone number"}
          disabled={disabled}
          hasError={Boolean(numberError)}
          aria-invalid={Boolean(numberError)}
          className={cn("min-w-0 flex-1", className)}
        />
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Optional single-input phone number (e.g. `contact_info.other_number`). Validated
 * against the primary number's country code unless entered in +international form.
 */
export const PhoneField = Object.assign(PhoneFieldComponent, {
  initialValues,
  validationSchema,
});

export const OtherNumberField = ({
  name,
  codeName,
  label,
  disabled,
}: {
  name: string;
  codeName: string;
  label: string;
  disabled?: boolean;
}) => {
  const { dialOptions } = useCountries();
  const [codeField] = useField<string | undefined>(codeName);
  const code = codeField.value || "+233";
  const countryCode = useMemo(
    () =>
      (dialOptions.find((option) => option.dialCode === code)?.countryCode ||
        "GH") as CountryCode,
    [code, dialOptions]
  );

  const [field] = useField<string | undefined>({
    name,
    validate: (value: string | undefined) => {
      if (!value || !value.trim()) return undefined;
      return parsePhoneNumberFromString(value, countryCode)?.isValid()
        ? undefined
        : "Enter a valid phone number";
    },
  });
  const error = useFieldError(name);

  return (
    <Field label={label} error={error}>
      <TextInput
        {...field}
        id={name}
        type="tel"
        value={field.value ?? ""}
        placeholder="Optional second number"
        disabled={disabled}
        hasError={Boolean(error)}
        aria-invalid={Boolean(error)}
      />
    </Field>
  );
};
