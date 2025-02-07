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
import { IRequest, useAddRequisition } from "../hooks/useAddRequisition";
import { useParams } from "react-router-dom";
import { useFetch } from "@/CustomHooks/useFetch";
import { IRequisitionDetails } from "../types/requestInterface";
import api from "@/utils/apiCalls";
import { useEffect, useState } from "react";
import MultiImageComponent, {
  image,
} from "@/pages/HomePage/Components/MultiImageComponent";
import AddSignature from "@/components/AddSignature";
import Modal from "@/components/Modal";

const Request = () => {
  const { setInitialRows, events: allEvents, } = useStore();
  const { departments: allDepartments } = useSettingsStore();

  const departments = Array.isArray(allDepartments)
    ? allDepartments.map((dept) => ({
        name: dept?.name,
        value: dept?.id,
      }))
    : [];

  const events = Array.isArray(allEvents)
    ? allEvents.map((event) => ({
        name: event?.name,
        value: event?.id,
      }))
    : [];

  const { id } = useParams();
  const decodedId = id ? window.atob(String(id)) : "";

  const [requestData, setRequestData] = useState<
    IRequisitionDetails | undefined
  >(undefined);
  const { data } = useFetch<{ data: { data: IRequisitionDetails } }>(
    api.fetch.fetchRequisitionDetails, {id:decodedId} );
  const { name } = decodeToken();
  const {
    currencies,
    handleSubmit,
    loading,
    handleAddSignature,
    closeModal,
    openSignature,
    imageChange,
    addingImage,
    handleSignature,
    signature,
    handleUpload,
    handleUploadImage
  } = useAddRequisition();
  const [formattedRequestDate, setFormattedRequestDate] = useState<string>("");
  const [initialImages, setInitialImages] = useState<image[]>([]);

  useEffect(() => {
    const response = data?.data?.data;
    if (response) {
      setRequestData(response);
      const products = data?.data?.data?.products?.map((product) => ({
        name: product?.name,
        amount: product?.unitPrice,
        quantity: product?.quantity,
        total: product?.quantity * product?.unitPrice,
        id: product?.id,
      }));
      if (products?.length) {
        setInitialRows(products);
      }

      if (response.attachmentLists?.length) {
        const images = response.attachmentLists?.map((img, idx) => {
          return {
            id: img.id,
            image: img.URL,
          };
        });
        setInitialImages(images);
      }
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

  const initialValues: IRequest = {
    requester_name: name,
    department_id: requestData?.summary?.department_id ?? "",
    event_id: requestData?.summary?.event_id ?? "",
    request_date: formattedRequestDate,
    comment: requestData?.comment ?? "",
    currency: requestData?.currency ?? "",
    approval_status: requestData?.summary?.status ?? "Draft",
    user_sign: requestData?.requester?.user_sign ?? "",
    attachmentLists: requestData?.attachmentLists ?? []
  };

  const title = id ? "Update request" : "Raise request";
  const defaultSignature = id ? requestData?.requester?.user_sign ?? "" : "";
  const isNoSignature = id && !requestData?.requester.user_sign;
  return (
    <PageOutline>
      <div className="mx-auto py-8 lg:container lg:w-4/6">
        <PageHeader title={title} />

        <Formik
          initialValues={initialValues}
          onSubmit={async (values) => {
            const data = await handleUploadImage()
            handleSubmit({...values, attachmentLists:data});
          }}
          validationSchema={addRequisitionSchema}
          enableReinitialize
        >
          {({ handleSubmit, setValues, values, validateForm, setTouched }) => (
            <>
              <Modal open={openSignature} onClose={closeModal}>
                <AddSignature
                  cancel={closeModal}
                  text="Submit"
                  header="Request Signing"
                  handleSignature={handleSignature}
                  loading={loading || addingImage}
                  defaultSignature={defaultSignature}
                  onSubmit={async () => {
                    try {
                      let updatedSignature = signature.signature as string;

                      if (signature.isImage && signature.signature) {
                        const formData = new FormData();
                        formData.append("file", signature.signature);

                        const response = await handleUpload(formData);

                        if (response?.URL) {
                          updatedSignature = response.URL;
                        }
                      }

                      setValues({
                        ...values,
                        approval_status: "Awaiting_HOD_Approval",
                        user_sign: updatedSignature,
                      });

                      // Delay calling handleSubmit to ensure values are updated
                      await new Promise((resolve) => setTimeout(resolve, 0));
                      handleSubmit();
                    } catch (error) {
                      console.error("Error in AddSignature submission:", error);
                    }
                  }}
                />
              </Modal>
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
                <MultiImageComponent
                  placeholder="Atatchments"
                  imageChange={imageChange}
                  initialImages={initialImages ?? []}
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
                {!id && (
                  <Button
                    value="Save as Draft"
                    className="secondary"
                    onClick={() => {
                      setValues({
                        ...values,
                        approval_status: "Draft",
                        user_sign: null,
                      });
                      handleSubmit();
                    }}
                    type="submit"
                    loading={loading || addingImage}
                  />
                )}
                {isNoSignature && (
                  <Button
                    value="Add signature"
                    className="secondary"
                    onClick={() => handleAddSignature(validateForm, setTouched)}
                  />
                )}
                <Button
                  value={id ? "Update" : "Send request"}
                  className="default"
                  loading={!!id && !openSignature && (loading || addingImage)}
                  onClick={() => {
                    if (!id) {
                      handleAddSignature(validateForm, setTouched);
                    } else {
                      handleSubmit();
                    }
                  }}
                />
              </div>
            </>
          )}
        </Formik>
      </div>
    </PageOutline>
  );
};

export default Request;
