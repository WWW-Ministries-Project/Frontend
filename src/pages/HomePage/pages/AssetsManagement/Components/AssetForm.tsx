import Button from "@/components/Button";
import FormikInputDiv from "@/components/FormikInput";
import FormikSelectField from "@/components/FormikSelect";
import { Field, Formik } from "formik";
import useSettingsStore from "../../Settings/utils/settingsStore";
import { assetFormValidator } from "../utils/assetsHelpers";
import { assetType } from "../utils/assetsInterface";
import { formatInputDate } from "@/utils/helperFunctions";

interface IAssetFormProps {
  onSubmit: (val: any) => void;
  loading?: boolean;
  initialValues: assetType | {};
  disabled?: boolean
}
const AssetForm = ({ loading, onSubmit, initialValues, disabled }: IAssetFormProps) => {
  const departmentsOptions = useSettingsStore(
    (state) => state.departmentsOptions
  );
  return (
    <Formik
      onSubmit={(val) => {
        onSubmit(val);
      }}
      initialValues={initialValues}
      validationSchema={assetFormValidator}
      enableReinitialize
    >
      {(form) => (
        <div className="flex flex-col gap-4 mt-4 w-full">
          <h2 className="H400 text-dark900 font-bold">Asset Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field
              component={FormikInputDiv}
              label="Asset name"
              id="name"
              name="name"
              disabled={disabled}
            />
            <Field
              component={FormikInputDiv}
              label="Asset ID"
              id="assets_id"
              name="assets_id"
              disabled={true}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {/* @ts-ignore */}
            <Field value={formatInputDate(form.values?.date_purchased)}
              component={FormikInputDiv}
              label="Date purchased"
              type="date"
              id="date_purchased"
              name="date_purchased"   
              disabled={disabled}           
            />
            <Field
              component={FormikInputDiv}
              label="Purchased from (Supplier)"
              id="supplier"
              name="supplier"
              disabled={disabled}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
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
              label="Status"
              id="status"
              name="status"
              disabled={disabled}
            />
          </div>

          <div className="grid md:grid-cols- gap-4">
            <Field
              component={FormikInputDiv}
              label="Description"
              id="description"
              name="description"
              type="textarea"
              inputClass=" !h-48 resize-none"
              disabled={disabled}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
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
              id="start_date"
              name="start_date"
              disabled={disabled}
            />
          </div>
          {!disabled && <div className="flex gap-4 justify-end mt-4">
            <Button
              value="Cancel"
              className="p-2 px-4 text-dark900 bg-transparent border"
              onClick={() => window.history.back()}
            />
            <Button
              value={"Save"}
              type={"submit"}
              className="p-2 px-4 text-white bg-primary"
              loading={loading}
              onClick={form.submitForm}
            />
          </div>}
        </div>
      )}
    </Formik>
  );
};

export default AssetForm;
