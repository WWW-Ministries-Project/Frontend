import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
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

  const { departmentsOptions, positionOptions } = useSettingsStore();

  return (
    <FieldArray name={prefix || "department_positions"}>
      {({ push, remove }) => (
        <>
          {values.map((_, index) => {
            const optionsAvailable = !(
              values[index].department_id &&
              positionOptions[Number(values[index].department_id)]?.length === 0
            );
            return (
              <Fragment key={index}>
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
                  <div>
                    <Field
                      component={FormikSelectField}
                      label="Position"
                      id={`department_positions.${index}.position_id`}
                      name={`department_positions.${index}.position_id`}
                      placeholder="Please select department first"
                      options={
                        positionOptions[Number(values[index].department_id)] ||
                        []
                      }
                      disabled={
                        disabled ||
                        !optionsAvailable ||
                        !values[index].department_id
                      }
                    />
                    {!optionsAvailable && (
                      <p className="text-sm text-mainGray pl-1">
                        No position available for selected department
                      </p>
                    )}
                  </div>
                  <Field
                    component={FormikInputDiv}
                    label="Start Date (Optional)"
                    type="date"
                    id={`department_positions.${index}.start_date`}
                    name={`department_positions.${index}.start_date`}
                    disabled={disabled}
                  />
                  <Field
                    component={FormikInputDiv}
                    label="End Date (Optional)"
                    type="date"
                    id={`department_positions.${index}.end_date`}
                    name={`department_positions.${index}.end_date`}
                    disabled={disabled}
                  />
                  {index !== values.length - 1 && <HorizontalLine />}
                </>
              </Fragment>
            );
          })}

          <FullWidth $justify="right">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                push({
                  department_id: "",
                  position_id: "",
                  start_date: "",
                  end_date: "",
                });
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
  start_date?: string;
  end_date?: string;
}
const initialValues: IDepartmentPositionSubForm[] = [
  {
    department_id: "",
    position_id: "",
    start_date: "",
    end_date: "",
  },
];

const validationSchema = array()
  .of(
    object().shape({
      department_id: string().required("Department is required"),
      position_id: string().required("Position is required"),
      start_date: string().nullable(),
      end_date: string()
        .nullable()
        .test(
          "end-after-start",
          "End date cannot be before start date",
          function (value) {
            const startDate = this.parent?.start_date;
            if (!value || !startDate) return true;
            return new Date(value) >= new Date(startDate);
          }
        ),
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
