import { FieldArray, getIn, useFormikContext } from "formik";
import { useMemo } from "react";
import { array, object, string } from "yup";

import {
  Field,
  SelectInput,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";

import useSettingsStore from "../../Settings/utils/settingsStore";
import { FormTextField } from "./form/formFields";
import { useFieldError } from "./form/formUtils";

const emptyRow = (): IDepartmentPositionSubForm => ({
  department_id: "",
  position_id: "",
  start_date: "",
  end_date: "",
});

const DepartmentRow = ({
  name,
  row,
  canRemove,
  onRemove,
  disabled,
}: {
  name: string;
  row: IDepartmentPositionSubForm;
  canRemove: boolean;
  onRemove: () => void;
  disabled?: boolean;
}) => {
  const { setFieldValue, setFieldTouched } = useFormikContext<object>();
  const { departmentsOptions, positionOptions } = useSettingsStore();
  const departmentError = useFieldError(`${name}.department_id`);
  const positions = row.department_id
    ? (positionOptions[Number(row.department_id)] ?? [])
    : [];
  const noPositions = Boolean(row.department_id) && positions.length === 0;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] items-start gap-3 rounded-lg border border-gray-200 p-4">
      <Field label="Department *" error={departmentError}>
        <SelectInput
          id={`${name}.department_id`}
          value={row.department_id ?? ""}
          disabled={disabled}
          hasError={Boolean(departmentError)}
          aria-invalid={Boolean(departmentError)}
          onBlur={() => setFieldTouched(`${name}.department_id`, true)}
          onChange={(event) => {
            setFieldValue(`${name}.department_id`, event.target.value);
            // Positions belong to a department, so a department change resets it.
            setFieldValue(`${name}.position_id`, "");
          }}
          options={[
            { value: "", label: "Select department" },
            ...(departmentsOptions || []).map((option) => ({
              value: String(option.value),
              label: option.label,
            })),
          ]}
        />
      </Field>
      <Field label="Position (optional)">
        <SelectInput
          id={`${name}.position_id`}
          value={row.position_id ?? ""}
          disabled={disabled || !row.department_id || noPositions}
          onChange={(event) =>
            setFieldValue(`${name}.position_id`, event.target.value)
          }
          options={[
            {
              value: "",
              label: !row.department_id
                ? "Select department first"
                : noPositions
                  ? "No positions in this department"
                  : "No position",
            },
            ...positions.map((option) => ({
              value: String(option.value),
              label: option.label,
            })),
          ]}
        />
      </Field>
      <FormTextField
        name={`${name}.start_date`}
        label="Start date (optional)"
        type="date"
        max=""
        disabled={disabled}
      />
      <FormTextField
        name={`${name}.end_date`}
        label="End date (optional)"
        type="date"
        max=""
        disabled={disabled}
      />
      <div className="col-span-full flex justify-end">
        <UiButton
          tone="danger"
          size="sm"
          onClick={onRemove}
          disabled={disabled || !canRemove}
        >
          Remove
        </UiButton>
      </div>
    </div>
  );
};

const DepartmentPositionSubFormComponent = ({
  disabled,
  prefix = "department_positions",
}: {
  disabled?: boolean;
  prefix?: string;
}) => {
  const { values: entire } = useFormikContext<object>();
  const rows: IDepartmentPositionSubForm[] = useMemo(
    () => getIn(entire, prefix) || initialValues,
    [entire, prefix],
  );

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-bold leading-7 text-gray-800">
        Departments &amp; positions
      </h2>
      <FieldArray name={prefix}>
        {({ push, remove }) => (
          <>
            {rows.map((row, index) => (
              <DepartmentRow
                key={index}
                name={`${prefix}.${index}`}
                row={row}
                canRemove={rows.length > 1}
                onRemove={() => remove(index)}
                disabled={disabled}
              />
            ))}
            <UiButton
              tone="ghost"
              className="self-start text-primary hover:bg-primary/5"
              onClick={() => push(emptyRow())}
              disabled={disabled}
            >
              + Add another department
            </UiButton>
          </>
        )}
      </FieldArray>
    </div>
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
      position_id: string(),
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
          },
        ),
    }),
  )
  .min(1);

export const DepartmentPositionSubForm = Object.assign(
  DepartmentPositionSubFormComponent,
  {
    initialValues,
    validationSchema,
  },
);
