import { ReactNode } from "react";
import { Button } from "../../../../../components";
import { InputDiv } from "../../../Components/reusable/InputDiv";
import SelectField from "../../../Components/reusable/SelectField";
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
  inputId: string;
  className?: string;
  selectOptions: { label: string; value: string | number }[];
  children?: ReactNode;
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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
      <div
        className={
          "userInfo z-10 text-primary border rounded-lg bg-white p-4  overflow-y-scroll shadow-lg " +
          props.className
        }
      >
        <div className="border-b border-[#F5F5F5] text-primaryGray text-lg font-manrope font-bold">
          {props.editMode ? "Edit " : "Create "} {props.inputLabel}
        </div>
        {props.children ? (
          props.children
        ) : (
          <form className="mt-5">
            <div className="flex flex-col gap-6 mb-5 border-b border-[#F5F5F5]">
              <InputDiv
                onChange={handleChange}
                type="text"
                id={props.inputId}
                label={props.inputLabel}
                value={props.inputValue.name}
                placeholder="Enter department name"
                className="w-full"
              />
              <SelectField
                onChange={handleChange}
                label={props.selectLabel}
                id={props.selectId}
                options={props.selectOptions}
                placeholder="Select head of department"
                value={
                  props.inputValue.department_head ||
                  props.inputValue.department_id
                }
              />
              <TextField
                onChange={handleChange}
                value={props.inputValue.description || ""}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                value="Close"
                className="p-3 bg-white border border-[#F5F5F5] text-primary"
                onClick={props.CloseForm}
              />
              <Button
                value={props.editMode ? "Update" : "Save"}
                className="p-3 bg-primary text-white disabled:opacity-50"
                onClick={onSubmit}
                loading={props.loading}
                disabled={!props.inputValue.name}
              />
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
