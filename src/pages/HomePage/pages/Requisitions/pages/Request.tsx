import AddSignature from "@/components/AddSignature";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { useAuth } from "@/context/AuthWrapper";
import { useFetch } from "@/CustomHooks/useFetch";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { relativePath } from "@/utils";
import { api } from "@/utils/api/apiCalls";
import { ApiResponse } from "@/utils/interfaces";
import { Formik } from "formik";
import { useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import RequisitionEditorFields from "../components/RequisitionEditorFields";
import { useAddRequisition } from "../hooks/useAddRequisition";
import { useRequisitionFormOptions } from "../hooks/useRequisitionFormOptions";
import type { IRequisitionDetails } from "../types/requestInterface";
import {
  buildRequisitionInitialValues,
  mapRequisitionAttachmentsToImages,
  mapRequisitionProductsToTableRows,
  type RequisitionFormValues,
} from "../types/requisitionForm";
import { getEditMeta } from "../utils/requestMetadata";
import { addRequisitionSchema } from "../utils/requisitionSchema";

type SubmissionIntent = "SAVE" | "SAVE_DRAFT" | "SUBMIT";

const Request = () => {
  const { id } = useParams();
  const decodedId = id ? window.atob(String(id)) : "";
  const myRequisitionPath = `${relativePath.home.main}/requests`;
  const submissionIntentRef = useRef<SubmissionIntent>("SAVE");

  const { data } = useFetch<ApiResponse<IRequisitionDetails>>(
    api.fetch.fetchRequisitionDetails as (
      query?: Record<string, string | number>,
    ) => Promise<ApiResponse<IRequisitionDetails>>,
    { id: decodedId },
    !decodedId,
  );

  const requestData = data?.data;

  const {
    user: { name },
  } = useAuth();

  const {
    departmentOptions,
    eventOptions,
    currencies,
    departmentsLoading,
    eventsLoading,
  } = useRequisitionFormOptions(requestData);

  const {
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

  const initialValues = useMemo<RequisitionFormValues>(
    () =>
      buildRequisitionInitialValues({
        requestData,
        requesterName: name,
      }),
    [name, requestData],
  );

  const tableData = useMemo(
    () => mapRequisitionProductsToTableRows(requestData),
    [requestData],
  );
  const initialImages = useMemo(
    () => mapRequisitionAttachmentsToImages(requestData),
    [requestData],
  );
  const hasAnyApprovedStep = useMemo(
    () =>
      Boolean(
        requestData?.approval_instances?.some((step) => step.status === "APPROVED"),
      ),
    [requestData?.approval_instances],
  );
  const isClosedRequest = useMemo(
    () =>
      requestData?.request_approval_status === "APPROVED" ||
      requestData?.request_approval_status === "REJECTED" ||
      requestData?.summary?.status === "APPROVED" ||
      requestData?.summary?.status === "REJECTED",
    [requestData?.request_approval_status, requestData?.summary?.status],
  );
  const requesterCanEdit = !id || (!hasAnyApprovedStep && !isClosedRequest);
  const title = id ? "Update requisition" : "Create requisition";
  const defaultSignature = id ? requestData?.requester?.user_sign ?? "" : "";
  const isNoSignature = Boolean(id && !requestData?.requester?.user_sign);
  const isDraftRequest =
    (requestData?.summary?.status ?? "Draft") === "Draft" && requesterCanEdit;
  const isLoadingExistingRequest = Boolean(id && !requestData);
  const editMeta = useMemo(() => getEditMeta(requestData), [requestData]);
  const crumbs = [
    { label: "Home", link: relativePath.home.main },
    { label: "My Requisition", link: myRequisitionPath },
    { label: id ? "Update Requisition" : "Create Requisition", link: "" },
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
            {id && !requesterCanEdit && (
              <div className="rounded-lg border border-lightGray bg-inputBackground/60 p-4 text-sm text-primaryGray">
                This requisition is read-only because approval has already started.
              </div>
            )}
            {isLoadingExistingRequest && (
              <div className="rounded-lg border border-lightGray p-4 text-sm text-primaryGray">
                Loading requisition details...
              </div>
            )}

            {!isLoadingExistingRequest && (
              <Formik
                initialValues={initialValues}
                onSubmit={async (values) => {
                  const submissionIntent = submissionIntentRef.current;
                  const uploadedAttachments = await handleUploadImage();
                  await handleSubmit(
                    { ...values, attachmentLists: uploadedAttachments },
                    {
                      submitForApproval: submissionIntent === "SUBMIT",
                      redirectToDetails: true,
                    },
                  );
                }}
                validationSchema={addRequisitionSchema}
                enableReinitialize
              >
                {({
                  handleSubmit: submitForm,
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
                        header="Requisition Signing"
                        handleSignature={handleSignature}
                        loading={loading || addingImage}
                        defaultSignature={defaultSignature}
                        onSubmit={async () => {
                          const updatedSignature = signature.trim();
                          if (!updatedSignature) {
                            return;
                          }

                          await setValues({
                            ...values,
                            user_sign: updatedSignature,
                          });

                          submissionIntentRef.current = "SUBMIT";
                          closeModal();
                          await submitForm();
                        }}
                      />
                    </Modal>

                    <RequisitionEditorFields
                      readOnly={!requesterCanEdit}
                      departmentOptions={departmentOptions}
                      eventOptions={eventOptions}
                      currencies={currencies}
                      departmentsLoading={departmentsLoading}
                      eventsLoading={eventsLoading}
                      initialImages={initialImages}
                      imageChange={imageChange}
                      onItemImageUpload={handleItemImageUpload}
                      imageUploadLoading={addingImage}
                      tableData={tableData}
                      attachmentFiles={requestData?.attachmentLists ?? []}
                    />

                    <div className="mt-2 flex w-full flex-wrap justify-end gap-3">
                      <Button
                        value="Cancel"
                        variant="ghost"
                        onClick={() => {
                          window.history.back();
                        }}
                      />
                      {requesterCanEdit && (!id || isDraftRequest) && (
                        <Button
                          value={id ? "Update Draft" : "Save as Draft"}
                          variant="secondary"
                          onClick={async () => {
                            submissionIntentRef.current = "SAVE_DRAFT";
                            await setValues({
                              ...values,
                              approval_status: "Draft",
                              user_sign: values.user_sign || null,
                            });
                            submitForm();
                          }}
                          loading={loading || addingImage}
                        />
                      )}
                      {requesterCanEdit && isNoSignature && (
                        <Button
                          value="Add signature"
                          variant="secondary"
                          onClick={() => handleAddSignature(validateForm, setTouched)}
                        />
                      )}
                      {requesterCanEdit && (
                        <Button
                          value={
                            !id
                              ? "Send requisition"
                              : isDraftRequest
                                ? "Submit requisition"
                                : "Update"
                          }
                          variant="default"
                          loading={!openSignature && (loading || addingImage)}
                          onClick={() => {
                            if (!id || isDraftRequest) {
                              handleAddSignature(validateForm, setTouched);
                            } else {
                              submissionIntentRef.current = "SAVE";
                              submitForm();
                            }
                          }}
                        />
                      )}
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
