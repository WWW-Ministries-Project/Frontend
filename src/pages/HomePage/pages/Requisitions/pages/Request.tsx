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
import { fetchCurrencies } from "@/pages/HomePage/utils/apiCalls";
import { useEffect, useState } from "react";
import { decodeToken } from "@/utils/helperFunctions";
import useEditableTableStore from "../requisitionStore/EditableTableStore";
import api from "@/utils/apiCalls";
import UsePost from "@/CustomHooks/usePost";
import { UserType } from "../../Members/utils/membersInterfaces";
import { ApiResponse } from "@/utils/interfaces";


const Request = () => {
  const departments =
    useSettingsStore().departments?.map((dept) => {
      return {
        name: dept?.name,
        value: dept?.id,
      };
    }) ?? [];
  const programs = useSettingsStore().positions?.map((event) => {
    return {
      name: event?.name,
      value: event?.id,
    };
  }) ?? [];
  const [currency, setCurrency] = useState<{ name: string; value: string }[]>(
    []
  );

  const { postData, loading, error, data } = UsePost<
    ApiResponse<{ data: UserType }>
  >(api.post.createRequisition);

  
  const { name,id } = decodeToken();
  const { rows } = useEditableTableStore();
  useEffect(() => {
    fetchCurrencies().then((data) =>
      setCurrency(
        data?.data?.map((data) => {
          return {
            name: data?.currency,
            value: data?.currency,
          };
        })
      )
    );
  }, []);
  return (
    <PageOutline>
      <PageHeader title="Raise request" />
      <Formik
        initialValues={{
          requester_name:name,
          department_id: "",
          event_id: "",
          request_date: "",
          comment: "",
          currency: "",
          approval_status:"Draft"
        }}
        onSubmit={(val) => {
          const data = rows.map((item) => {
            return {
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.amount,
            };
          });
          const dataToSend = { ...val, products: data, user_id:id,attachmentLists:[] };
          postData(dataToSend)
        }}
        validationSchema={addRequisitionSchema}
      >
        {({ handleSubmit, values }) => (
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
                options={programs}
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
                options={currency}
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
              />
            </div>
          </>
        )}
      </Formik>
    </PageOutline>
  );
};

export default Request;
