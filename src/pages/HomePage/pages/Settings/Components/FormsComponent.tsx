import { FormHeader, FormLayout } from "@/components/ui";
import { Button } from "../../../../../components";
import { InputDiv } from "../../../Components/reusable/InputDiv";
import { SelectField } from "../../../Components/reusable/SelectField";
import TextField from "../../../Components/reusable/TextField";

interface IProps {
  onChange: (name: string, value: string | number) => void;
  onSubmit: () => void;
  editMode?: boolean;
  CloseForm: () => void;
  loading?: boolean;
  inputValue: {
    name: string;
    department_head?: number;
    department_id?: number;
    description?: string;
    [key: string]: string | number | undefined;
  };
  inputLabel: string;
  selectLabel: string;
  selectId: string;
  className?: string;
  selectOptions: { label: string; value: string | number }[];
}

export const FormsComponent = (props: IProps) => {
  function handleChange(name: string, value: string | number) {
    if (name === "department_head") {
      props.onChange(name, Number(value));
    } else if (name === "department_id") {
      props.onChange(name, +value);
    } else {
      props.onChange(name, value);
    }
  }

  function onSubmit() {
    props.onSubmit();
  }

  return (
    <form className="mt-5 px-5 pb-5">
      <FormLayout $columns={1}>
        <FormHeader>
          {props.editMode ? "Edit " : "Create "} {props.inputLabel}
        </FormHeader>
        <InputDiv
          onChange={handleChange}
          type="text"
          id={"name"}
          label={props.inputLabel}
          value={props.inputValue.name}
          placeholder={`Enter ${props.inputLabel} name`}
          className="w-full"
        />
        <SelectField
          onChange={handleChange}
          label={props.selectLabel}
          id={props.selectId}
          options={props.selectOptions}
          placeholder={`Select ${props.selectLabel}`}
          value={
            props.inputValue.department_head || props.inputValue.department_id
          }
        />
        <TextField
          onChange={handleChange}
          value={props.inputValue.description || ""}
        />
      </FormLayout>
      <div className="flex gap-2 justify-end">
        <Button value="Close" variant="ghost" onClick={props.CloseForm} />
        <Button
          value={props.editMode ? "Update" : "Save"}
          variant="primary"
          onClick={onSubmit}
          disabled={props.loading || !props.inputValue.name}
          loading={props.loading}
        />
      </div>
    </form>
  );
};
