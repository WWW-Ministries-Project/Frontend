import InputDiv, {
  InputDivProps,
} from "@/pages/HomePage/Components/reusable/InputDiv";
import { FieldProps, getIn } from "formik";

interface FormikInputDivProps extends FieldProps, Omit<InputDivProps, "name"> {}

export function fieldToInputDiv({
  form: { touched, errors },
  field: { onChange: fieldOnChange, ...field },
  ...props
}: FormikInputDivProps): InputDivProps {
  const fieldError = getIn(errors, field.name);
  const showError = getIn(touched, field.name) && fieldError;

  return {
    ...field,
    ...props,
    id: props.id,
    value: field.value,
    onChange:
      props.onChange ??
      ((name: string, value: string | number) =>
        fieldOnChange({ target: { name, value } })),
    disabled: props.disabled,
    className: props.className,
    inputClass: props.inputClass,
    label: props.label,
    placeholder: props.placeholder,
    type: props.type,
    error: showError,
  };
}

export default function FormikInputDiv({ ...props }: FormikInputDivProps) {
  return <InputDiv {...fieldToInputDiv(props)} />;
}

FormikInputDiv.displayName = "FormikInputDiv";
