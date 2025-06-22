import { Button } from "@/components";
import FormikSelectField from "@/components/FormikSelect";
import { FullWidth } from "@/components/ui";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import { Field, FieldArray, getIn, useFormikContext } from "formik";
import { Fragment, useMemo } from "react";
import { array, object, string } from "yup";
import useSettingsStore from "../../Settings/utils/settingsStore";

const DepartmentPositionSubFormComponent = ({
  disabled,
  prefix,
}: {
  disabled?: boolean;
  prefix?: string;
}) => {
  const { values: entire } = useFormikContext<object>();
  const values: IDepartmentPositionSubForm[] = useMemo(
    () => getIn(entire, prefix || "department_positions") || initialValues,
    [entire, prefix]
  );

  const { departmentsOptions, positionsOptions } = useSettingsStore();

  return (
    <FieldArray name={prefix || "department_positions"}>
      {({ push, remove }) => (
        <>
          {values.map((_, index) => (
            <Fragment key={index}>
              <>
                {values.length > 1 && (
                  <FullWidth $justify="right">
                    <button
                      type="button"
                      onClick={() => {
                        remove(index);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                      disabled={disabled}
                    >
                      Remove
                    </button>
                  </FullWidth>
                )}
              </>

              <>
                <Field
                  component={FormikSelectField}
                  label="Ministry/Department"
                  id={`department_positions.${index}.department_id`}
                  name={`department_positions.${index}.department_id`}
                  placeholder="Select department"
                  options={departmentsOptions || []}
                  disabled={disabled}
                />

                <Field
                  component={FormikSelectField}
                  label="Position"
                  id={`department_positions.${index}.position_id`}
                  name={`department_positions.${index}.position_id`}
                  placeholder="Select position"
                  options={positionsOptions || []}
                  disabled={disabled}
                />
                {index !== values.length - 1 && <HorizontalLine />}
              </>
            </Fragment>
          ))}

          <FullWidth $justify="right">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                push({ department_id: "", position_id: "" });
              }}
              disabled={disabled}
              value=" Add Another Ministry/Department & Position"
            />
          </FullWidth>
        </>
      )}
    </FieldArray>
  );
};

export interface IDepartmentPositionSubForm {
  department_id: string;
  position_id: string;
}
const initialValues: IDepartmentPositionSubForm[] = [
  {
    department_id: "",
    position_id: "",
  },
];

const validationSchema = array()
  .of(
    object().shape({
      department_id: string().required("Department is required"),
      position_id: string().required("Position is required"),
    })
  )
  .min(1);

export const DepartmentPositionSubForm = Object.assign(
  DepartmentPositionSubFormComponent,
  {
    initialValues,
    validationSchema,
  }
);
