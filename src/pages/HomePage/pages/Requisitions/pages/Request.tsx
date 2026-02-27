import AddSignature from "@/components/AddSignature";
import { Button } from "@/components/Button";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { Modal } from "@/components/Modal";
import { useAuth } from "@/context/AuthWrapper";
import { useFetch } from "@/CustomHooks/useFetch";
import MultiImageComponent, {
  image,
} from "@/pages/HomePage/Components/MultiImageComponent";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { useStore } from "@/store/useStore";
import { relativePath } from "@/utils";
import { api } from "@/utils/api/apiCalls";
import { EventType } from "@/utils/api/events/interfaces";
import { DepartmentType } from "@/utils/api/settings/departmentInterfaces";
import { ApiResponse } from "@/utils/interfaces";
import FormWrapperNew from "@/Wrappers/FormWrapperNew";
import { Field, Formik } from "formik";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import useSettingsStore from "../../Settings/utils/settingsStore";
import EditableTable from "../components/EditableTable";
import { IRequest, useAddRequisition } from "../hooks/useAddRequisition";
import { IRequisitionDetails } from "../types/requestInterface";
import { getEditMeta } from "../utils/requestMetadata";
import { addRequisitionSchema } from "../utils/requisitionSchema";

type DropdownOption = {
  label: string;
  value: string | number;
};

const toOption = (
  label: unknown,
  value: unknown
): DropdownOption | null => {
  const normalizedLabel = String(label ?? "").trim();

  if (!normalizedLabel) {
    return null;
  }

  if (value === null || value === undefined || value === "") {
    return null;
  }

  return {
    label: normalizedLabel,
    value: value as string | number,
  };
};

const dedupeOptions = (options: DropdownOption[]): DropdownOption[] => {
  const seenValues = new Set<string>();

  return options.filter((option) => {
    const key = String(option.value);

    if (!key || seenValues.has(key)) {
      return false;
    }

    seenValues.add(key);
    return true;
  });
};

const Request = () => {
  const { id } = useParams();
  const decodedId = id ? window.atob(String(id)) : "";
  const requestsPath = `${relativePath.home.main}/requests`;

  const { setInitialRows, events: storedEvents } = useStore((state) => ({
    setInitialRows: state.setInitialRows,
    events: state.events,
  }));

  const { departments: storedDepartments } = useSettingsStore((state) => ({
    departments: state.departments,
  }));

  const [requestData, setRequestData] = useState<
    IRequisitionDetails | undefined
  >(undefined);
  const [initialImages, setInitialImages] = useState<image[]>([]);
  const [submissionIntent, setSubmissionIntent] = useState<
    "SAVE" | "SAVE_DRAFT" | "SUBMIT"
  >("SAVE");

  const { data: departmentsData, loading: departmentsLoading } = useFetch<
    ApiResponse<DepartmentType[]>
  >(
    api.fetch.fetchDepartments as (
      query?: Record<string, string | number>
    ) => Promise<ApiResponse<DepartmentType[]>>
  );

  const { data: eventsData, loading: eventsLoading } = useFetch<
    ApiResponse<EventType[]>
  >(
    api.fetch.fetchAllUniqueEvents as (
      query?: Record<string, string | number>
    ) => Promise<ApiResponse<EventType[]>>
  );

  const { data } = useFetch<ApiResponse<IRequisitionDetails>>(
    api.fetch.fetchRequisitionDetails as (
      query?: Record<string, string | number>
    ) => Promise<ApiResponse<IRequisitionDetails>>,
    { id: decodedId },
    !decodedId
  );

  const {
    user: { name },
  } = useAuth();

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
    handleUploadImage,
    handleItemImageUpload,
  } = useAddRequisition();

  useEffect(() => {
    if (!decodedId) {
      setRequestData(undefined);
      setInitialRows([]);
      setInitialImages([]);
    }
  }, [decodedId, setInitialRows]);

  useEffect(() => {
    const response = data?.data;

    if (!response) {
      return;
    }

    setRequestData(response);

    const products =
      response.products?.map((product) => ({
        name: product?.name,
        amount: product?.unitPrice,
        quantity: product?.quantity,
        total: product?.quantity * product?.unitPrice,
        image_url: product?.image_url ?? product?.image ?? "",
        id: product?.id,
      })) ?? [];

    setInitialRows(products);

    const images =
      response.attachmentLists?.map((attachment) => ({
        id: attachment.id,
        image: attachment.URL,
      })) ?? [];

    setInitialImages(images);
  }, [data, setInitialRows]);

  const departmentOptions = useMemo(() => {
    const source =
      departmentsData?.data?.length && departmentsData.data.length > 0
        ? departmentsData.data
        : storedDepartments;

    const mapped = source
      .map((department) => toOption(department?.name, department?.id))
      .filter((option): option is DropdownOption => Boolean(option));

    const requestDepartmentId = requestData?.summary?.department_id;
    const requestDepartment = requestData?.summary?.department;

    if (
      requestDepartmentId &&
      !mapped.some(
        (option) => String(option.value) === String(requestDepartmentId)
      )
    ) {
      const fallback = toOption(
        requestDepartment || `Department ${requestDepartmentId}`,
        requestDepartmentId
      );

      if (fallback) {
        mapped.push(fallback);
      }
    }

    return dedupeOptions(mapped);
  }, [departmentsData?.data, requestData?.summary, storedDepartments]);

  const eventOptions = useMemo(() => {
    const source =
      eventsData?.data?.length && eventsData.data.length > 0
        ? eventsData.data
        : storedEvents;

    const mapped = source
      .map((event) => {
        const normalizedEvent = event as {
          id?: string | number;
          name?: string;
          event_name?: string;
          event_name_id?: string | number;
        };

        const label =
          normalizedEvent?.name ?? normalizedEvent?.event_name ?? "";
        const value =
          normalizedEvent?.id ?? normalizedEvent?.event_name_id ?? "";

        return toOption(label, value);
      })
      .filter((option): option is DropdownOption => Boolean(option));

    const requestProgramId = requestData?.summary?.program_id;
    const requestProgramName = requestData?.summary?.program;

    if (
      requestProgramId &&
      !mapped.some((option) => String(option.value) === String(requestProgramId))
    ) {
      const fallback = toOption(
        requestProgramName || `Event ${requestProgramId}`,
        requestProgramId
      );

      if (fallback) {
        mapped.push(fallback);
      }
    }

    return dedupeOptions(mapped);
  }, [eventsData?.data, requestData?.summary, storedEvents]);

  const initialValues: IRequest = {
    requester_name: requestData?.requester?.name ?? name,
    department_id: requestData?.summary?.department_id ?? "",
    event_id: requestData?.summary?.program_id ?? "",
    request_date: requestData?.summary?.request_date
      ? DateTime.fromISO(requestData.summary.request_date).toFormat("yyyy-MM-dd")
      : DateTime.now().toFormat("yyyy-MM-dd"),
    comment: requestData?.comment ?? "",
    currency: requestData?.currency || "GHS",
    approval_status: requestData?.summary?.status ?? "Draft",
    user_sign: requestData?.requester?.user_sign ?? "",
    attachmentLists: requestData?.attachmentLists ?? [],
  };

  const title = id ? "Update request" : "Create request";
  const defaultSignature = id ? requestData?.requester?.user_sign ?? "" : "";
  const isNoSignature = Boolean(id && !requestData?.requester?.user_sign);
  const isDraftRequest = (requestData?.summary?.status ?? "Draft") === "Draft";
  const isLoadingExistingRequest = Boolean(id && !requestData);
  const editMeta = useMemo(() => getEditMeta(requestData), [requestData]);
  const crumbs = [
    { label: "Home", link: relativePath.home.main },
    { label: "Requests", link: requestsPath },
    { label: id ? "Update Request" : "Create Request", link: "" },
  ];

  return (
    <div className="p-4">
      <PageOutline crumbs={crumbs}>
        <section className="mx-auto w-full max-w-6xl">
          <div className="app-card space-y-4 p-4 md:p-6">
            <PageHeader title={title} />
            <p className="text-sm text-primaryGray">
              Complete the requisition details below. Add item images directly at
              the item row level for clearer approvals.
            </p>
            {id && (
              <div className="rounded-lg border border-lightGray bg-[#F8F9FC] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primaryGray">
                  Requester
                </p>
                <p className="mt-1 text-base font-semibold text-primary">
                  {initialValues.requester_name || "Unknown requester"}
                </p>
                <p className="mt-1 text-sm text-primaryGray">
                  {editMeta.hasEditMeta
                    ? `Last edited by ${editMeta.editorName || "Unknown editor"} on ${
                        editMeta.formattedEditedAt || "Unknown date"
                      }`
                    : "Last edited: Not edited yet"}
                </p>
              </div>
            )}
            {isLoadingExistingRequest && (
              <div className="rounded-lg border border-lightGray p-4 text-sm text-primaryGray">
                Loading request details...
              </div>
            )}

            {!isLoadingExistingRequest && (
              <Formik
                initialValues={initialValues}
                onSubmit={async (values) => {
                  const uploadedAttachments = await handleUploadImage();
                  await handleSubmit(
                    { ...values, attachmentLists: uploadedAttachments },
                    {
                      submitForApproval: submissionIntent === "SUBMIT",
                    }
                  );
                }}
                validationSchema={addRequisitionSchema}
                enableReinitialize
              >
                {({
                  handleSubmit,
                  setValues,
                  values,
                  validateForm,
                  setTouched,
                }) => (
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
                          const updatedSignature = signature.trim();
                          if (!updatedSignature) {
                            return;
                          }

                          setValues({
                            ...values,
                            user_sign: updatedSignature,
                          });

                          setSubmissionIntent("SUBMIT");
                          await new Promise((resolve) => setTimeout(resolve, 0));
                          handleSubmit();
                        }}
                      />
                    </Modal>

                  <section className="rounded-xl border border-lightGray p-4 md:p-5">
                    <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">
                      Request Information
                    </h4>
                    <FormWrapperNew>
                      <Field
                        component={FormikInputDiv}
                        name="requester_name"
                        label="Requester"
                        id="requester_name"
                        disabled
                      />
                      <Field
                        component={FormikSelectField}
                        name="department_id"
                        label="Department"
                        options={departmentOptions}
                        id="department_id"
                        placeholder="Select department"
                        helperText={
                          departmentOptions.length === 0
                            ? departmentsLoading
                              ? "Loading departments..."
                              : "No departments available"
                            : undefined
                        }
                      />
                      <Field
                        component={FormikSelectField}
                        name="event_id"
                        label="Event"
                        options={eventOptions}
                        id="event_id"
                        placeholder="Select event"
                        helperText={
                          eventOptions.length === 0
                            ? eventsLoading
                              ? "Loading events..."
                              : "No events available"
                            : undefined
                        }
                      />
                      <Field
                        component={FormikInputDiv}
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
                        helperText="Default: Ghana Cedi (GHS)"
                      />
                      <span aria-hidden="true" />
                      <Field
                        component={FormikInputDiv}
                        name="comment"
                        label="Comment"
                        id="comment"
                        type="textarea"
                        className="md:col-span-2"
                      />
                    </FormWrapperNew>
                  </section>

                  <section className="rounded-xl border border-lightGray p-4 md:p-5">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">
                        Request Items
                      </h4>
                      <span className="text-xs text-primaryGray">
                        Upload image per item row
                      </span>
                    </div>
                    <EditableTable
                      onImageUpload={handleItemImageUpload}
                      imageUploadLoading={addingImage}
                    />
                  </section>

                  <section className="rounded-xl border border-lightGray p-4 md:p-5">
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">
                        General Attachments
                      </h4>
                      <p className="text-xs text-primaryGray">
                        Optional supporting files for the overall request.
                      </p>
                    </div>
                    <MultiImageComponent
                      placeholder="Attachments"
                      imageChange={imageChange}
                      initialImages={initialImages ?? []}
                    />
                  </section>

                  <div className="mt-2 flex w-full flex-wrap justify-end gap-3">
                    <Button
                      value="Cancel"
                      variant="ghost"
                      onClick={() => {
                        window.history.back();
                      }}
                    />
                    {(!id || isDraftRequest) && (
                      <Button
                        value={id ? "Update Draft" : "Save as Draft"}
                        variant="secondary"
                        onClick={() => {
                          setSubmissionIntent("SAVE_DRAFT");
                          setValues({
                            ...values,
                            approval_status: "Draft",
                            user_sign: values.user_sign || null,
                          });
                          handleSubmit();
                        }}
                        loading={loading || addingImage}
                      />
                    )}
                    {isNoSignature && (
                      <Button
                        value="Add signature"
                        variant="secondary"
                        onClick={() =>
                          handleAddSignature(validateForm, setTouched)
                        }
                      />
                    )}
                    <Button
                      value={!id ? "Send request" : isDraftRequest ? "Submit request" : "Update"}
                      variant="default"
                      loading={!openSignature && (loading || addingImage)}
                      onClick={() => {
                        if (!id || isDraftRequest) {
                          handleAddSignature(validateForm, setTouched);
                        } else {
                          setSubmissionIntent("SAVE");
                          handleSubmit();
                        }
                      }}
                    />
                  </div>
                  </>
                )}
              </Formik>
            )}
          </div>
        </section>
      </PageOutline>
    </div>
  );
};

export default Request;
