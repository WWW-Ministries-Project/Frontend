import Button from "@/components/Button";
import FormikInput from "@/components/FormikInput";
import FormikSelectField from "@/components/FormikSelect";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import FormWrapperNew from "@/Wrappers/FormWrapperNew";
import { Field, Formik } from "formik";
import useSettingsStore from "../../Settings/utils/settingsStore";
import EditableTable from "../components/EditableTable";

const Request = () => {
  const departments = useSettingsStore().departments;
  const programs = useSettingsStore().positions;
  return (
    <PageOutline>
      <PageHeader
        title="Raise request"
      />
      <Formik
        initialValues={{}}
        onSubmit={(val) => {
          console.log(val);
        }}
      >
        <FormWrapperNew>
          <Field
            component={FormikInput}
            name="name"
            label="Requester"
            id="requester"
          />
          <Field
            component={FormikSelectField}
            name="department"
            label="Department"
            options={departments}
          />
          <Field
            component={FormikSelectField}
            name="program"
            label="Program"
            options={programs}
            required={true}
          />
          <Field
            component={FormikInput}
            name="date"
            label="Date of requisition"
            id="requester"
            type="date"
          />
          <Field
            component={FormikInput}
            name="comment"
            label="Comment"
            id="requester"
            type="textarea"
            col = {50}
          />
          <Field
            component={FormikInput}
            name="comment"
            label="Comment"
            id="requester"
            type="textarea"
          />
        </FormWrapperNew>
      </Formik>
      <div className="w-full h-[1px] bg-lightGray my-4"></div>
      <EditableTable />
      <div className="w-full h-[1px] bg-lightGray"></div>
      <div className="w-full flex justify-end gap-x-4 mt-4">
        <Button value="Cancel" className="tertiary" onClick={() => {window.history.back()}} />
        <Button value="Save as Draft" className="secondary" />
        <Button value="Send request" className="default" />
      </div>
    </PageOutline>
  );
};

export default Request;
