import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { FormHeader, FormLayout, FullWidth } from "@/components/ui";
import { formatInputDate } from "@/utils";
import { Field, Formik } from "formik";
import { useMemo } from "react";
import { object, string } from "yup";
import useSettingsStore from "../../Settings/utils/settingsStore";

interface IProps {
  onSubmit: (val: IAssetForm) => void;
  loading?: boolean;
  assetData?: IAssetForm;
  disabled?: boolean;
}

const AssetFormComponent = ({
  loading,
  onSubmit,
  assetData,
  disabled,
}: IProps) => {
  const departmentsOptions = useSettingsStore(
    (state) => state.departmentsOptions
  );
  const initial = useMemo(() => assetData || initialValues, [assetData]);
  return (
    <Formik
      onSubmit={(val) => {
        onSubmit(val);
      }}
      initialValues={initial}
      validationSchema={validationSchema}
      enableReinitialize
    >
      {(form) => (
        <FormLayout>
          <FormHeader>Asset Information</FormHeader>
          <Field
            component={FormikInputDiv}
            label="Asset name *"
            placeholder="Asset name"
            id="name"
            name="name"
            disabled={disabled}
          />
          <Field
            component={FormikInputDiv}
            label="Asset ID"
            id="asset_id"
            name="asset_id"
            disabled={true}
          />
          <Field
            component={FormikInputDiv}
            label="Date purchased *"
            placeholder="Date purchased"
            type="date"
            id="date_purchased"
            name="date_purchased"
            value={formatInputDate(form.values.date_purchased)}
            disabled={disabled}
          />
          <Field
            component={FormikInputDiv}
            label="Purchased from (Supplier)"
            id="supplier"
            name="supplier"
            disabled={disabled}
          />
          <Field
            component={FormikInputDiv}
            label="Amount"
            id="price"
            name="price"
            type="number"
            disabled={disabled}
          />
          <Field
            component={FormikSelectField}
            options={[
              { name: "Assigned", value: "ASSIGNED" },
              { name: "Unassigned", value: "UNASSIGNED" },
              { name: "Not fixable", value: "NOT_FIXABLE" },
              { name: "Out of repairs", value: "OUT_OF_REPAIRS" },
              { name: "Lost/Stolen", value: "LOST_OR_STOLEN" },
            ]}
            label="Status *"
            id="status"
            name="status"
            disabled={disabled}
          />

          <FullWidth>
            <Field
              component={FormikInputDiv}
              label="Description"
              id="description"
              name="description"
              type="textarea"
              inputClass=" !h-48 resize-none"
              className="w-full md:w-6/7"
              disabled={disabled}
            />
          </FullWidth>
          <Field
            component={FormikSelectField}
            options={departmentsOptions}
            label="Assigned to"
            id="department_assigned"
            name="department_assigned"
            disabled={disabled}
          />
          <Field
            component={FormikInputDiv}
            label="Date of assignment"
            type="date"
            id="date_assigned"
            name="date_assigned"
            value={formatInputDate(form.values.date_assigned)}
            disabled={disabled}
          />
          {!disabled && (
            <FullWidth $justify={"right"}>
              <div className="flex gap-x-4 mt-4">
                <Button
                  value="Cancel"
                  variant="ghost"
                  onClick={() => window.history.back()}
                />
                <Button
                  value={"Save"}
                  type={"submit"}
                  variant="primary"
                  loading={loading}
                  disabled={loading}
                  onClick={form.submitForm}
                />
              </div>
            </FullWidth>
          )}
        </FormLayout>
      )}
    </Formik>
  );
};

export interface IAssetForm {
  name: string;
  status: string;
  description: string;
  department_assigned: string;
  date_assigned: string;
  date_purchased: string;
  price: string;
  supplier: string;
  asset_id: string;
}

const initialValues: IAssetForm = {
  name: "",
  status: "",
  description: "",
  department_assigned: "",
  date_assigned: "",
  date_purchased: "",
  price: "",
  supplier: "",
  asset_id: "",
};

const validationSchema = object({
  name: string().required("Name is required"),
  status: string().required("Status is required"),
  description: string().required("Description is required"),
  department_assigned: string().when("status", (status, schema) => {
    if (typeof status === "string" && status === "ASSIGNED") {
      return schema.required("Department is required");
    }
    return schema.nullable();
  }),
});

export const AssetForm = Object.assign(AssetFormComponent, {
  initialValues,
  validationSchema,
});
