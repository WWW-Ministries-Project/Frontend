import { FieldProps, getIn } from 'formik';
import SelectField from '@/pages/HomePage/Components/reusable/SelectFields';

interface Option {
  value: string | number;
  name: string;
}

interface SelectFieldProps {
  type?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  id: string;
  value?: string | number;
  onChange: (name: string, value: string | number) => void;
  options: Option[];
  disabled?: boolean;
}

interface FormikSelectFieldProps extends FieldProps, Omit<SelectFieldProps, 'name' | 'value'> {
  id: string;
}



export function fieldToSelectField({
  form: { touched, errors },
  field: { onChange: fieldOnChange, ...field },
  id,
  ...props
}: FormikSelectFieldProps): SelectFieldProps {
  const fieldError = getIn(errors, id);
  const showError = getIn(touched, id) && !!fieldError;

  return {
    ...field,
    id,
    value: field.value,
    onChange: props.onChange ?? ((name: string, value: string | number) => fieldOnChange({ target: { name, value } })),
    disabled: props.disabled,
    className: props.className,
    options: props.options,
    label: props.label,
    placeholder: props.placeholder,
    type: props.type,
  };
}

export default function FormikSelectField(props: FormikSelectFieldProps) {
  const { id, field, ...rest } = props;
  const updatedField = { ...field, name: id }; // Ensuring the field name is set to id
  return <SelectField {...fieldToSelectField({ ...rest, field: updatedField, id })} />;
}

FormikSelectField.displayName = 'FormikSelectField';
