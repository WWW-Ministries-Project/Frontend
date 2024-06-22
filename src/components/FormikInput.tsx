import { FieldProps, getIn } from 'formik'
import InputDiv, {InputDivProps} from '@/pages/HomePage/Components/reusable/InputDs'



interface FormikInputDivProps extends FieldProps, Omit<InputDivProps, 'name' > {}


export function fieldToInputDiv({
  field: { onChange: fieldOnChange, ...field },
  ...props
}: FormikInputDivProps): InputDivProps {
  

  return {
    ...field,
    ...props,
    id: props.id,
    value: field.value,
    onChange: props.onChange ?? ((name: string, value: string | number) => fieldOnChange({ target: { name, value } })),
    disabled: props.disabled,
    className: props.className,
    inputClass: props.inputClass,
    label: props.label,
    placeholder: props.placeholder,
    type: props.type,
  }
}

export default function FormikInputDiv({ ...props }: FormikInputDivProps) {
  return <InputDiv {...fieldToInputDiv(props)} />
}

FormikInputDiv.displayName = 'FormikInputDiv'
