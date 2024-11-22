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
import { useParams } from "react-router-dom";
import { useFetch } from "@/CustomHooks/useFetch";
import { IRequisitionDetails } from "../types/requestInterface";
import api from "@/utils/apiCalls";
import { useEffect, useState } from "react";
import useEditableTableStore from "../requisitionStore/EditableTableStore";

const Request = () => {
  const { departments = [] } = useSettingsStore();
  const { events = [] } = useStore();

  const { id } = useParams();
  const { setInitialRows } = useEditableTableStore();
  const [requestData, setRequestData] = useState<IRequisitionDetails | undefined>(undefined);
  const {
    data,
    loading: isLoading,
    error,
  } = useFetch<{ data: { data: IRequisitionDetails } }>(
    api.fetch.fetchRequisitionDetails,
    { id: id ? window.atob(String(id)) : "" }
  );
  const { name } = decodeToken();
  const { currencies, handleSubmit, loading } = useAddRequisition();
  const [formattedRequestDate, setFormattedRequestDate] = useState<string>("");

  useEffect(() => {
    if (data?.data?.data?.products) {
      setRequestData(data.data.data);
      const products = data.data.data.products.map((product) => ({
        name: product?.name,
        amount: product?.unitPrice,
        quantity: product?.quantity,
        total: product?.quantity * product?.unitPrice,
      }));
      setInitialRows(products);
    }
  }, [data, setInitialRows]);

  useEffect(() => {
    const fetchFormattedDate = async () => {
      if (requestData?.summary?.request_date) {
        const date = await getFormatedDate(requestData.summary.request_date);
        setFormattedRequestDate(date);
      }
    };
    fetchFormattedDate();
  }, [requestData]);

  const getFormatedDate = async (date: string) => {
    const { DateTime } = await import("luxon");
    return DateTime.fromISO(date).toFormat("yyyy-MM-dd");
  };

  return (
    <PageOutline>
      <PageHeader title={id ? "Update request" : "Raise request"} />

      <Formik
        initialValues={{
          requester_name: name,
          department_id: requestData?.summary?.department ??"",
          event_id: requestData?.summary?.program??"",
          request_date: formattedRequestDate ,
          comment: requestData?.comment ?? "",
          currency: requestData?.currency ?? "",
          approval_status: requestData?.summary?.status ?? "Draft",
        }}
        onSubmit={handleSubmit}
        validationSchema={addRequisitionSchema}
        enableReinitialize
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
                value={id ? "Update" : "Send request"}
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
