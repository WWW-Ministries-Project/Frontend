import { SelectField } from "@/pages/HomePage/Components/reusable/SelectField";
import { FieldProps, getIn } from "formik";

interface Option {
  value: string | number;
  label: string;
}

interface SelectFieldProps {
  type?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  id: string;
  value?: string | number | null;
  onChange: (name: string, value: string | number | null) => void;
  options: Option[];
  disabled?: boolean;
  error?: string;
  helperText?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  clearable?: boolean;
}

interface FormikSelectFieldProps
  extends FieldProps,
    Omit<SelectFieldProps, "name"> {
  id: string;
}

function fieldToSelectField({
  form: { touched, errors },
  field: { onChange: fieldOnChange, ...field },
  ...props
}: FormikSelectFieldProps): SelectFieldProps {
  const fieldError = getIn(errors, field.name);
  const showError = getIn(touched, field.name) && fieldError;

  return {
    ...field,
    ...props,
    id: props.id,
    value: props.value ?? field.value,
    onChange:
      props.onChange ??
      ((name: string, value: string | number | null) =>
        fieldOnChange({ target: { name, value: value ?? "" } })),
    disabled: props.disabled,
    className: props.className,
    options: props.options,
    label: props.label,
    placeholder: props.placeholder,
    type: props.type,
    error: showError,
    helperText: props.helperText,
    searchable: props.searchable,
    searchPlaceholder: props.searchPlaceholder,
    clearable: props.clearable,
  };
}

export default function FormikSelectField({
  ...props
}: FormikSelectFieldProps) {
  return <SelectField {...fieldToSelectField(props)} />;
}
FormikSelectField.displayName = "FormikSelectField";
