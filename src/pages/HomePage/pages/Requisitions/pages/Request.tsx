import Button from "@/components/Button";
import FormikInput from "@/components/FormikInput";
import FormikSelectField from "@/components/FormikSelect";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import FormWrapperNew from "@/Wrappers/FormWrapperNew";
import { Field, Formik } from "formik";
import useSettingsStore from "../../Settings/utils/settingsStore";
import EditableTable from "../components/EditableTable";
import { addRequisitionSchema } from "../utils/requisitionSchema";
import { decodeToken } from "@/utils/helperFunctions";
import { useStore } from "@/store/useStore";
import { useAddRequisition } from "../hooks/useAddRequisition";

const Request = () => {
  const departments =
    useSettingsStore().departments?.map((dept) => {
      return {
        name: dept?.name,
        value: dept?.id,
      };
    }) ?? [];

  const events = useStore().events?.map((event) => {
    return {
      name: event.name,
      value: event.id,
    };
  });

 
  const { name } = decodeToken();
  const  {currencies, handleSubmit, loading} = useAddRequisition()

  return (
    <PageOutline>
      <PageHeader title="Raise request" />

      <Formik
        initialValues={{
          requester_name: name,
          department_id: "",
          event_id: "",
          request_date: "",
          comment: "",
          currency: "",
          approval_status: "Draft",
        }}
        onSubmit={handleSubmit}
        validationSchema={addRequisitionSchema}
      >
        {({ handleSubmit }) => (
          <>
            <FormWrapperNew>
              <Field
                component={FormikInput}
                name="requester_name"
                label="Requester"
                id="requester_name"
                disabled
              />
              <Field
                component={FormikSelectField}
                name="department_id"
                label="Department"
                options={departments}
                id="department_id"
                placeholder="Select department"
              />
              <Field
                component={FormikSelectField}
                name="event_id"
                label="Program"
                options={events}
                required={true}
                id="event_id"
                placeholder="Select program/event"
              />
              <Field
                component={FormikInput}
                name="request_date"
                label="Date of requisition"
                id="request_date"
                type="date"
              />
              <Field
                component={FormikSelectField}
                name="currency"
                label="Currency"
                id="currency"
                options={currencies}
                placeholder="Select currency"
              />
              <span> &nbsp;</span>
              <Field
                component={FormikInput}
                name="comment"
                label="Comment"
                id="comment"
                type="textarea"
                col={50}
              />
            </FormWrapperNew>

            <HorizontalLine />
            <EditableTable />
            <HorizontalLine />
            <div className="w-full flex justify-end gap-x-4 mt-4">
              <Button
                value="Cancel"
                className="tertiary"
                onClick={() => {
                  window.history.back();
                }}
              />
              <Button value="Save as Draft" className="secondary" />
              <Button
                value="Send request"
                className="default"
                onClick={() => handleSubmit()}
                type="submit"
                loading={loading}
              />
            </div>
          </>
        )}
      </Formik>
    </PageOutline>
  );
};

export default Request;
