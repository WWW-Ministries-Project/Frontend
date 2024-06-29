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
  error?:string;
}

interface FormikSelectFieldProps extends FieldProps, Omit<SelectFieldProps, 'name' | 'value'> {
  id: string;
}



export function fieldToSelectField({
  form: { touched, errors },
  field: { onChange: fieldOnChange, ...field },
  ...props
}: FormikSelectFieldProps): SelectFieldProps {
  const fieldError = getIn(errors, field.name);
  const showError = getIn(touched, field.name) && fieldError;

  return {
    ...field,
    id:props.id,
    value: field.value,
    onChange: props.onChange ?? ((name: string, value: string | number) => fieldOnChange({ target: { name, value } })),
    disabled: props.disabled,
    className: props.className,
    options: props.options,
    label: props.label,
    placeholder: props.placeholder,
    type: props.type,
    error:showError
  };
}

export default function FormikSelectField({...props}: FormikSelectFieldProps) {
  
  return <SelectField {...fieldToSelectField(props)} />;
}
FormikSelectField.displayName = 'FormikSelectField';
