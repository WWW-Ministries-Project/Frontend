import { Button } from "@/components";
import FormikSelectField from "@/components/FormikSelect";
import { FullWidth } from "@/components/ui";
import { Field, FieldArray, getIn, useFormikContext } from "formik";
import { useMemo } from "react";
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
        <FullWidth>
          <div className="space-y-4   w-full">
            <div className="space-y-4">
              {values.map((_, index) => (
                <div
                  key={index}
                  className="border  rounded-lg p-3 relative w-full"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-700"></h4>
                    {values.length > 1 && (
                      <>
                        <Button
                          value="Remove"
                          variant="secondary"
                          type="button"
                          onClick={() => remove(index)}
                        />
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
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                      component={FormikSelectField}
                      label="Ministry/Department"
                      id={`department_positions.${index}.department_name`}
                      name={`department_positions.${index}.department_name`}
                      placeholder="Select department"
                      options={departmentsOptions || []}
                      disabled={disabled}
                    />

                    <Field
                      component={FormikSelectField}
                      label="Position"
                      id={`department_positions.${index}.position_name`}
                      name={`department_positions.${index}.position_name`}
                      placeholder="Select position"
                      options={positionsOptions || []}
                      disabled={disabled}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end w-full">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  push({ department_name: "", position_name: "" });
                }}
                disabled={disabled}
                value=" Add Another Ministry/Department & Position"
              />
              {/* <Button
                            variant="ghost"
                              type="button"
                              onClick={() => {
                                push({ department_name: "", position_name: "" });
                                addDepartmentPosition();
                              }}
                              disabled={disabled}
                              value=" Add Another Ministry/Department & Position"
                            /> */}
            </div>
          </div>
        </FullWidth>
      )}
    </FieldArray>
  );
};

export interface IDepartmentPositionSubForm {
  department_name: string;
  position_name: string;
}
const initialValues: IDepartmentPositionSubForm[] = [
  {
    department_name: "",
    position_name: "",
  },
];

const validationSchema = array()
  .of(
    object().shape({
      department_name: string().required("Department is required"),
      position_name: string().required("Position is required"),
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
