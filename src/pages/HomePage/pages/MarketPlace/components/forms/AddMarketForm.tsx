import { Field, Form, Formik, type FormikErrors } from "formik";
import { useMemo } from "react";
import { date, mixed, number, object, ref, string } from "yup";

import { BranchSelectField } from "@/components/BranchSelectField";
import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";
import type { IMarket } from "@/utils/api/marketPlace/interface";
import type { eventType } from "../../../EventsManagement/utils/eventInterfaces";
import { btnPrimary, btnSecondary, inputCls, labelCls, selectCls } from "../markets/styles";

interface IProps {
  onSubmit: (values: IMarket) => void;
  onClose: () => void;
  editData: IMarket | null;
  loading: boolean;
  events: eventType[] | undefined;
  isDuplicate?: boolean;
  /** Error returned by the API, shown in the form's error line. */
  serverError?: string;
}

const toDateInput = (value?: string) => (value ? String(value).slice(0, 10) : "");

const ERROR_ORDER: (keyof IMarket)[] = [
  "name",
  "description",
  "event_id",
  "start_date",
  "end_date",
  "branch_id",
];

const firstError = (errors: FormikErrors<IMarket>) => {
  for (const key of ERROR_ORDER) {
    const e = errors[key];
    if (typeof e === "string") return e;
  }
  return "";
};

export function AddMarketForm({
  onSubmit,
  onClose,
  editData,
  loading,
  events,
  isDuplicate = false,
  serverError,
}: IProps) {
  const initials = useMemo<IMarket>(
    () =>
      editData
        ? {
            ...initialValues,
            ...editData,
            start_date: toDateInput(editData.start_date),
            end_date: toDateInput(editData.end_date),
            event_id: editData.event_id ?? "",
            branch_id: editData.branch_id ?? "",
          }
        : initialValues,
    [editData]
  );

  const isEdit = Boolean(editData?.id) && !isDuplicate;
  const title = isDuplicate
    ? "Duplicate market"
    : isEdit
      ? "Edit market"
      : "Create market";
  const saveLabel = isDuplicate
    ? "Duplicate market"
    : isEdit
      ? "Save changes"
      : "Create market";

  return (
    <Formik
      initialValues={initials}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize
      validateOnBlur={false}
    >
      {({ values, setFieldValue, errors, submitCount }) => {
        const error = (submitCount > 0 && firstError(errors)) || serverError;
        return (
          <Form className="flex flex-col gap-3.5 p-6 text-primary" noValidate>
            <div>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="text-sm text-primaryGray">
                {isDuplicate
                  ? "Copies every product into a new market with fresh dates."
                  : "Set up a storefront for your event merchandise."}
              </p>
            </div>

            <label className={labelCls}>
              Market name
              <Field name="name" className={inputCls} />
            </label>

            <label className={labelCls}>
              Description
              <Field
                as="textarea"
                name="description"
                rows={3}
                className={`${inputCls} h-auto py-2.5`}
              />
            </label>

            <label className={labelCls}>
              Linked event
              <Field as="select" name="event_id" className={`${selectCls} w-full`}>
                <option value="">Select an event</option>
                {(events || []).map((event) => (
                  <option key={event.id} value={String(event.id)}>
                    {event.event_name || event.name}
                  </option>
                ))}
              </Field>
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className={labelCls}>
                Opens
                <Field type="date" name="start_date" className={inputCls} />
              </label>
              <label className={labelCls}>
                Closes
                <Field type="date" name="end_date" className={inputCls} />
              </label>
            </div>

            <BranchSelectField
              value={values.branch_id ?? ""}
              onChange={(v) => setFieldValue("branch_id", v)}
              required
            />

            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                className={btnSecondary}
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className={btnPrimary} disabled={loading}>
                {loading ? "Saving…" : saveLabel}
              </button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}

const initialValues: IMarket = {
  name: "",
  description: "",
  start_date: "",
  end_date: "",
  id: "",
  event_id: "",
  branch_id: "",
};

const validationSchema = object().shape({
  name: string().trim().required("Add a market name."),
  description: string().trim().required("Add a short description."),
  event_id: mixed()
    .required("Link the market to an event.")
    .test(
      "event-required",
      "Link the market to an event.",
      (value) => String(value || "").trim() !== ""
    ),
  start_date: date()
    .typeError("Pick an opening date.")
    .required("Pick an opening date."),
  end_date: date()
    .typeError("Pick a closing date.")
    .required("Pick a closing date.")
    .min(ref("start_date"), "End date must be after the start date."),
  branch_id: number()
    .transform((v, orig) => (orig === "" ? undefined : v))
    .when([], {
      is: () => useBranchStore.getState().activeBranchId === ALL_BRANCHES,
      then: (schema) => schema.required("Select a branch."),
      otherwise: (schema) => schema.optional(),
    }),
});
