import { useEffect, useMemo, useRef, useState } from "react";
import { Field, Form, Formik, FormikHelpers } from "formik";
import * as Yup from "yup";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChatBubbleLeftEllipsisIcon,
  InformationCircleIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components";
import { HeaderControls } from "@/components/HeaderControls";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { useDelete } from "@/CustomHooks/useDelete";
import { useRouteAccess } from "@/context/RouteAccessContext";
import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import { cn } from "@/utils/cn";
import { normalizeAppointmentReasons } from "@/utils/api/appointment/bookingUtils";
import {
  AppointmentReason,
  CreateAppointmentReasonPayload,
} from "@/utils/api/appointment/interfaces";

interface ReasonFormValues {
  label: string;
  description: string;
}

const reasonSchema = Yup.object({
  label: Yup.string()
    .trim()
    .min(2, "Label must be at least 2 characters")
    .max(120, "Label cannot exceed 120 characters")
    .required("Label is required"),
  description: Yup.string()
    .trim()
    .max(255, "Description cannot exceed 255 characters"),
});

const emptyReason: ReasonFormValues = { label: "", description: "" };

// The backend answers duplicates/validation with `{ message }`; axios wraps it.
const errorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const message = (error as { response?: { data?: { message?: unknown } } })
      .response?.data?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const toPayload = (values: ReasonFormValues): CreateAppointmentReasonPayload => ({
  label: values.label.trim(),
  description: values.description.trim() || null,
});

const ReasonForm = ({
  initialValues,
  submitLabel,
  loading,
  onSubmit,
  onCancel,
  idPrefix,
}: {
  initialValues: ReasonFormValues;
  submitLabel: string;
  loading: boolean;
  onSubmit: (
    values: ReasonFormValues,
    helpers: FormikHelpers<ReasonFormValues>
  ) => void;
  onCancel?: () => void;
  idPrefix: string;
}) => (
  <Formik
    initialValues={initialValues}
    validationSchema={reasonSchema}
    onSubmit={onSubmit}
  >
    {({ values }) => (
      <Form className="space-y-3" noValidate>
        <Field
          component={FormikInputDiv}
          label="Label *"
          name="label"
          id={`${idPrefix}-label`}
          placeholder="e.g. Marriage & family"
          className="w-full"
        />
        <div>
          <Field
            component={FormikInputDiv}
            type="textarea"
            label="Description (optional)"
            name="description"
            id={`${idPrefix}-description`}
            placeholder="Shown under the label to help members choose"
            className="w-full"
          />
          <p className="mt-1 text-right text-xs text-primaryGray">
            {values.description.trim().length}/255
          </p>
        </div>
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              value="Cancel"
              type="button"
              variant="secondary"
              onClick={onCancel}
            />
          )}
          <Button
            value={submitLabel}
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
          />
        </div>
      </Form>
    )}
  </Formik>
);

const ActiveSwitch = ({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cn(
      "inline-flex items-center gap-2 rounded-full text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    )}
  >
    <span
      className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors",
        checked ? "bg-primary" : "bg-lightGray"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full border border-gray-300 bg-white shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </span>
    <span className={checked ? "text-primary" : "text-primaryGray"}>
      {checked ? "Active" : "Inactive"}
    </span>
  </button>
);

const AppointmentSettings = () => {
  const { canManageCurrentRoute } = useRouteAccess();

  const {
    data: reasonsResponse,
    loading: reasonsLoading,
    error: reasonsError,
    refetch,
  } = useFetch(api.fetch.fetchManageAppointmentReasons);

  const [items, setItems] = useState<AppointmentReason[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addFormKey, setAddFormKey] = useState(0);
  const lastUpdate = useRef<"edit" | "toggle" | null>(null);

  const fetchedReasons = useMemo(
    () => normalizeAppointmentReasons(reasonsResponse?.data),
    [reasonsResponse]
  );

  useEffect(() => {
    setItems(fetchedReasons);
  }, [fetchedReasons]);

  const {
    data: createResponse,
    error: createError,
    loading: createLoading,
    postData: createReason,
  } = usePost(api.post.createAppointmentReason);
  const {
    data: updateResponse,
    error: updateError,
    loading: updateLoading,
    updateData: updateReason,
  } = usePut(api.put.updateAppointmentReason);
  const {
    data: reorderResponse,
    error: reorderError,
    loading: reorderLoading,
    updateData: reorderReasons,
  } = usePut(api.put.reorderAppointmentReasons);
  const {
    executeDelete,
    success: deleteSuccess,
    error: deleteError,
  } = useDelete(api.delete.deleteAppointmentReason);

  useEffect(() => {
    if (!createResponse) return;
    showNotification("Reason added.", "success", "Booking reasons");
    setAddFormKey((key) => key + 1);
    refetch();
  }, [createResponse, refetch]);

  useEffect(() => {
    if (!createError) return;
    showNotification(errorMessage(createError, "Unable to add reason."), "error");
  }, [createError]);

  useEffect(() => {
    if (!updateResponse) return;
    if (lastUpdate.current === "edit") {
      showNotification("Reason updated.", "success", "Booking reasons");
      setEditingId(null);
    }
    lastUpdate.current = null;
    refetch();
  }, [updateResponse, refetch]);

  useEffect(() => {
    if (!updateError) return;
    lastUpdate.current = null;
    showNotification(errorMessage(updateError, "Unable to update reason."), "error");
    refetch();
  }, [updateError, refetch]);

  useEffect(() => {
    if (!reorderResponse) return;
    refetch();
  }, [reorderResponse, refetch]);

  useEffect(() => {
    if (!reorderError) return;
    showNotification(errorMessage(reorderError, "Unable to reorder reasons."), "error");
    refetch();
  }, [reorderError, refetch]);

  useEffect(() => {
    if (!deleteSuccess) return;
    showNotification("Reason deleted.", "success", "Booking reasons");
    refetch();
  }, [deleteSuccess, refetch]);

  useEffect(() => {
    if (!deleteError) return;
    showNotification(errorMessage(deleteError, "Unable to delete reason."), "error");
  }, [deleteError]);

  const handleCreate = (
    values: ReasonFormValues,
    helpers: FormikHelpers<ReasonFormValues>
  ) => {
    if (!canManageCurrentRoute) return;
    createReason({ ...toPayload(values), is_active: true });
    helpers.setSubmitting(false);
  };

  const handleEdit = (
    reason: AppointmentReason,
    values: ReasonFormValues,
    helpers: FormikHelpers<ReasonFormValues>
  ) => {
    if (!canManageCurrentRoute) return;
    lastUpdate.current = "edit";
    updateReason(toPayload(values), { id: String(reason.id) });
    helpers.setSubmitting(false);
  };

  const handleToggle = (reason: AppointmentReason, next: boolean) => {
    if (!canManageCurrentRoute) return;
    setItems((current) =>
      current.map((item) =>
        item.id === reason.id ? { ...item, is_active: next } : item
      )
    );
    lastUpdate.current = "toggle";
    updateReason({ is_active: next }, { id: String(reason.id) });
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    if (!canManageCurrentRoute) return;
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    reorderReasons({ ids: next.map((item) => item.id) });
  };

  const handleDelete = (reason: AppointmentReason) => {
    if (!canManageCurrentRoute) return;
    showDeleteDialog({ id: reason.id, name: reason.label }, (id) =>
      executeDelete({ id: String(id) })
    );
  };

  const activeCount = items.filter((item) => item.is_active).length;
  const showInitialLoading = reasonsLoading && items.length === 0;
  const showError = Boolean(reasonsError) && items.length === 0;

  return (
    <div>
      <PageOutline>
        <HeaderControls
          title="Settings"
          subtitle="Configure how members book appointments"
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section
            aria-labelledby="booking-reasons-heading"
            className="app-card space-y-4 lg:col-span-2"
          >
            <div className="space-y-1">
              <h2
                id="booking-reasons-heading"
                className="text-lg font-semibold text-primary"
              >
                Booking reasons
              </h2>
              <p className="text-sm text-primaryGray">
                Members pick one of these on step 1 of booking ("What would you
                like to talk about?"). Only active reasons are shown, in this
                order.
                {items.length > 0 &&
                  ` ${activeCount} of ${items.length} active.`}
              </p>
            </div>

            <div className="flex gap-3 rounded-lg border border-lightGray bg-lightGray/20 p-3 text-sm text-primaryGray">
              <InformationCircleIcon
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary"
                aria-hidden="true"
              />
              <p>
                Members always also see a built-in{" "}
                <span className="font-medium text-primary">
                  "Something else — tell us in your own words"
                </span>{" "}
                option as the last choice, so you don't need to add a
                catch-all reason. If no reasons are active, members see three
                defaults (Marriage &amp; family, Spiritual guidance, Ministry
                &amp; serving).
              </p>
            </div>

            {showInitialLoading ? (
              <div className="space-y-3" aria-busy="true" aria-live="polite">
                <span className="sr-only">Loading booking reasons…</span>
                {[0, 1, 2].map((key) => (
                  <div
                    key={key}
                    className="h-16 animate-pulse rounded-lg bg-lightGray/40"
                  />
                ))}
              </div>
            ) : showError ? (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <p className="font-medium">Couldn't load booking reasons.</p>
                <p className="mt-1">
                  {errorMessage(reasonsError, "Please try again.")}
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-3 rounded-lg border border-red-300 px-3 py-1.5 font-medium hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  Try again
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-lightGray px-5 py-8 text-center">
                <ChatBubbleLeftEllipsisIcon
                  className="mx-auto h-10 w-10 text-primaryGray"
                  aria-hidden="true"
                />
                <p className="mt-3 font-medium text-primary">
                  No booking reasons yet
                </p>
                <p className="mt-1 text-sm text-primaryGray">
                  Members currently see the three default reasons plus
                  "Something else". Add your own to replace the defaults.
                </p>
              </div>
            ) : (
              <ol className="space-y-3" aria-label="Booking reasons in order">
                {items.map((reason, index) => {
                  const isEditing = editingId === reason.id;

                  return (
                    <li
                      key={reason.id}
                      className={cn(
                        "rounded-lg border border-lightGray bg-white p-4",
                        !reason.is_active && "bg-lightGray/20"
                      )}
                    >
                      {isEditing ? (
                        <ReasonForm
                          idPrefix={`reason-${reason.id}`}
                          initialValues={{
                            label: reason.label,
                            description: reason.description ?? "",
                          }}
                          submitLabel="Save"
                          loading={updateLoading}
                          onSubmit={(values, helpers) =>
                            handleEdit(reason, values, helpers)
                          }
                          onCancel={() => setEditingId(null)}
                        />
                      ) : (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          {canManageCurrentRoute && (
                            <div className="flex gap-1 sm:flex-col">
                              <button
                                type="button"
                                className="app-icon-btn disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label={`Move "${reason.label}" up`}
                                disabled={index === 0 || reorderLoading}
                                onClick={() => handleMove(index, -1)}
                              >
                                <ArrowUpIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="app-icon-btn disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label={`Move "${reason.label}" down`}
                                disabled={
                                  index === items.length - 1 || reorderLoading
                                }
                                onClick={() => handleMove(index, 1)}
                              >
                                <ArrowDownIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "break-words font-medium",
                                reason.is_active
                                  ? "text-primary"
                                  : "text-primaryGray"
                              )}
                            >
                              {reason.label}
                            </p>
                            {reason.description ? (
                              <p className="mt-0.5 break-words text-sm text-primaryGray">
                                {reason.description}
                              </p>
                            ) : (
                              <p className="mt-0.5 text-sm italic text-primaryGray/70">
                                No description
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <ActiveSwitch
                              checked={reason.is_active}
                              disabled={!canManageCurrentRoute || updateLoading}
                              label={`Show "${reason.label}" to members`}
                              onChange={(next) => handleToggle(reason, next)}
                            />
                            {canManageCurrentRoute && (
                              <>
                                <button
                                  type="button"
                                  className="app-icon-btn"
                                  aria-label={`Edit "${reason.label}"`}
                                  onClick={() => setEditingId(reason.id)}
                                >
                                  <PencilSquareIcon className="h-4 w-4 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  className="app-icon-btn app-icon-btn-danger"
                                  aria-label={`Delete "${reason.label}"`}
                                  onClick={() => handleDelete(reason)}
                                >
                                  <TrashIcon className="h-4 w-4 text-red-600" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {canManageCurrentRoute && (
            <section
              aria-labelledby="add-reason-heading"
              className="app-card h-fit space-y-4"
            >
              <div className="space-y-1">
                <h2
                  id="add-reason-heading"
                  className="text-lg font-semibold text-primary"
                >
                  Add a reason
                </h2>
                <p className="text-sm text-primaryGray">
                  New reasons are active and added to the end of the list.
                </p>
              </div>
              <ReasonForm
                key={addFormKey}
                idPrefix="new-reason"
                initialValues={emptyReason}
                submitLabel="Add reason"
                loading={createLoading}
                onSubmit={handleCreate}
              />
            </section>
          )}
        </div>
      </PageOutline>
    </div>
  );
};

export default AppointmentSettings;
