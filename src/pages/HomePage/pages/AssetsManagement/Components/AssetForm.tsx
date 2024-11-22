import Button from "@/components/Button";
import FormikInputDiv from "@/components/FormikInput";
import FormikSelectField from "@/components/FormikSelect";
import { Field, Formik } from "formik";
import useSettingsStore from "../../Settings/utils/settingsStore";

interface IAssetFormProps {
  onSubmit: (val: any) => void;
  loading?: boolean;
}
const AssetForm = ({loading,onSubmit}: IAssetFormProps) => {
  const departmentsOptions = useSettingsStore((state) => state.departmentsOptions);
  return (
    <Formik onSubmit={(val) => {onSubmit(val)}} initialValues={{}}>
      {(form) => (
        <div className="flex flex-col gap-4 mt-4 w-full">
          <h2 className="H400 text-dark900 font-bold">Asset Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field
              component={FormikInputDiv}
              label="Asset name"
              id="name"
              name="name"
            />
            <Field
              component={FormikInputDiv}
              label="Asset ID"
              id="assets_id"
              name="assets_id"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field
              component={FormikInputDiv}
              label="Date purchased"
              type="date"
              id="date_purchased"
              name="date_purchased"
            />
            <Field
              component={FormikInputDiv}
              label="Purchased from (Supplier)"
              id="supplier"
              name="supplier"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field
              component={FormikInputDiv}
              label="Amount"
              id="price"
              name="price"
              type="number"
            />
            <Field
              component={FormikSelectField}
              options={[
                { name: "Assigned", value: "ASSIGNED" },
                { name: "Unassigned", value: "UNASSIGNED" },
                { name: "Not fixable", value: "NOT FIXABLE" },
                { name: "Out of repairs", value: "OUT OF REPAIRS" },
                { name: "Lost/Stolen", value: "LOST/STOLEN" },
              ]}
              label="Status"
              id="status"
              name="status"
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
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field
              component={FormikSelectField}
              options={departmentsOptions}
              label="Assigned to"
              id="department_assigned"
              name="department_assigned"
            />
            <Field
              component={FormikInputDiv}
              label="Date of assignment"
              type="date"
              id="start_date"
              name="start_date"
            />
          </div>
          <div className="flex gap-4 justify-end mt-4">
            <Button
              value="Cancel"
              className="p-2 px-4 text-primaryViolet bg-transparent border"
              onClick={() => window.history.back()}
            />
            <Button
              value={"Save"}
              type={"submit"}
              className="p-2 px-4 text-white bg-primaryViolet"
              loading={loading}
              onClick={form.submitForm}
            />
          </div>
        </div>
      )}
    </Formik>
  );
};

export default AssetForm;
