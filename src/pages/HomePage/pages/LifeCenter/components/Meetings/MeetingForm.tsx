import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { FormHeader, FormLayout } from "@/components/ui";
import { Modal } from "@/components/Modal";
import Multiselect from "@/components/MultiSelect";
import TextEditor from "@/components/TextEditor";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import { LifeCenterMemberType } from "@/utils";
import { Field, Form, Formik } from "formik";
import { useEffect, useMemo, useState } from "react";
import { array, object, string } from "yup";
import DOMPurify from "dompurify";
import {
  EligibleFirstTimerType,
  MeetingType,
} from "@/utils/api/lifeCenter/interfaces";
import { ISoulsWonForm, SoulsWonForm } from "../SoulsWonForm";

export interface IMeetingForm {
  id?: string;
  lifeCenterId: string;
  date: string;
  attendees: string[];
  firstTimers: string[];
  offeringAmount: string;
  currency: string;
  note: string;
}

const initialValues: IMeetingForm = {
  lifeCenterId: "",
  date: "",
  attendees: [],
  firstTimers: [],
  offeringAmount: "",
  currency: "GHS",
  note: "",
};

const CURRENCY_OPTIONS = [
  { value: "GHS", label: "Ghana Cedi (GHS)" },
  { value: "USD", label: "US Dollar (USD)" },
  { value: "GBP", label: "British Pound (GBP)" },
];

const validationSchema = object().shape({
  date: string()
    .required("Date is required")
    .test(
      "not-future",
      "Date cannot be in the future",
      (value) => !value || new Date(value) <= new Date()
    ),
  offeringAmount: string().required("Offering amount is required"),
  currency: string().required("Currency is required"),
  attendees: array().of(string()),
  firstTimers: array().of(string()),
  note: string().optional(),
});

interface IProps {
  lifeCenterId: string;
  editData: MeetingType | null;
  leader: LifeCenterMemberType | undefined;
  loading: boolean;
  onSubmit: (payload: {
    id?: string;
    lifeCenterId: string;
    date: string;
    offeringAmount: string;
    currency: string;
    note: string | null;
    attendeeSoulWonIds: number[];
    firstTimerSoulWonIds: number[];
    newFirstTimers: unknown[];
  }) => void;
  onClose: () => void;
}

export const MeetingForm = ({
  lifeCenterId,
  editData,
  leader,
  loading,
  onSubmit,
  onClose,
}: IProps) => {
  const [extraFirstTimers, setExtraFirstTimers] = useState<
    EligibleFirstTimerType[]
  >([]);
  const [showAddFirstTimer, setShowAddFirstTimer] = useState(false);

  const { data: soulsData } = useFetch(api.fetch.fetchSoulsWon, {
    lifeCenterId,
  });
  const { data: eligibleData, refetch: refetchEligible } = useFetch(
    api.fetch.fetchEligibleFirstTimers,
    { lifeCenterId }
  );

  const {
    postData: createFirstTimer,
    data: createFirstTimerResponse,
    loading: creatingFirstTimer,
  } = usePost(api.post.createSoul);

  const initial = useMemo<IMeetingForm>(() => {
    if (!editData) {
      return { ...initialValues, lifeCenterId };
    }
    return {
      id: String(editData.id),
      lifeCenterId,
      date: editData.date.slice(0, 10),
      attendees: editData.attendees
        .filter((a) => !a.isFirstTimer)
        .map((a) => String(a.soulWonId)),
      firstTimers: editData.attendees
        .filter((a) => a.isFirstTimer)
        .map((a) => String(a.soulWonId)),
      offeringAmount: editData.offeringAmount,
      currency: editData.currency,
      note: editData.note ?? "",
    };
  }, [editData, lifeCenterId]);

  const soulOptions = useMemo(
    () =>
      (soulsData?.data ?? []).map((s) => ({
        value: String(s.id),
        label: `${s.first_name} ${s.last_name}`,
      })),
    [soulsData]
  );

  const firstTimerBaseOptions = useMemo(
    () =>
      [...(eligibleData?.data ?? []), ...extraFirstTimers].map((s) => ({
        value: String(s.id),
        label: `${s.first_name} ${s.last_name}`,
      })),
    [eligibleData, extraFirstTimers]
  );

  return (
    <Formik
      initialValues={initial}
      enableReinitialize
      validationSchema={validationSchema}
      onSubmit={(values) => {
        const totalPeople = values.attendees.length + values.firstTimers.length;
        if (totalPeople === 0) {
          showNotification(
            "Add at least one attendee or first-timer",
            "error"
          );
          return;
        }
        onSubmit({
          id: values.id,
          lifeCenterId: values.lifeCenterId,
          date: values.date,
          offeringAmount: values.offeringAmount,
          currency: values.currency,
          note: values.note ? DOMPurify.sanitize(values.note) : null,
          attendeeSoulWonIds: values.attendees.map(Number),
          firstTimerSoulWonIds: values.firstTimers.map(Number),
          newFirstTimers: [],
        });
      }}
    >
      {({ values, setFieldValue, handleSubmit }) => {
        const attendeeOptions = soulOptions.filter(
          (o) => !values.firstTimers.includes(o.value)
        );
        const firstTimerOptions = firstTimerBaseOptions.filter(
          (o) => !values.attendees.includes(o.value)
        );

        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          const created = createFirstTimerResponse?.data;
          if (created?.id) {
            const idStr = String(created.id);
            setExtraFirstTimers((prev) => [
              ...prev,
              {
                id: idStr,
                first_name: created.first_name,
                last_name: created.last_name,
              },
            ]);
            setFieldValue("firstTimers", [...values.firstTimers, idStr]);
            setShowAddFirstTimer(false);
            refetchEligible();
            showNotification("First timer added", "success");
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [createFirstTimerResponse]);

        return (
          <Form className="flex h-[85vh] w-full max-h-[calc(100dvh-3rem)] flex-col overflow-hidden rounded-lg bg-white shadow-sm">
            <div className="sticky top-0 z-10 bg-primary text-white">
              <FormHeader>
                <p className="text-lg font-semibold">
                  {values.id ? "Update" : "Add"} a Meeting
                </p>
                <p className="text-sm">
                  Log who attended, offering gathered, and any notes.
                </p>
              </FormHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <FormLayout>
                <Field
                  type="date"
                  name="date"
                  component={FormikInputDiv}
                  label="Date of meeting *"
                  id="date"
                  max={new Date().toISOString().split("T")[0]}
                />

                <div>
                  <label className="text-primary font-semibold" htmlFor="attendees">
                    Attendees
                  </label>
                  <Multiselect
                    options={attendeeOptions}
                    selectedValues={values.attendees}
                    onChange={(selected) => setFieldValue("attendees", selected)}
                    placeholder="Select who came"
                    emptyMsg="No attendees selected"
                  />
                </div>

                <div>
                  <label className="text-primary font-semibold" htmlFor="firstTimers">
                    First timers
                  </label>
                  <Multiselect
                    options={firstTimerOptions}
                    selectedValues={values.firstTimers}
                    onChange={(selected) => setFieldValue("firstTimers", selected)}
                    placeholder="Select first timers"
                    emptyMsg="No first timers selected"
                  />
                  <button
                    type="button"
                    className="mt-2 text-sm font-medium text-primary underline"
                    onClick={() => setShowAddFirstTimer(true)}
                  >
                    + Add new first timer
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 md:col-span-2 md:gap-5">
                  <Field
                    name="currency"
                    component={FormikSelectField}
                    options={CURRENCY_OPTIONS}
                    label="Currency *"
                    id="currency"
                  />
                  <Field
                    type="number"
                    name="offeringAmount"
                    component={FormikInputDiv}
                    label="Offering amount *"
                    id="offeringAmount"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-primary font-semibold" htmlFor="note">
                    Note (optional)
                  </label>
                  <TextEditor
                    value={values.note}
                    onChange={(value) => setFieldValue("note", value)}
                    placeholder="Anything worth remembering about this meeting..."
                    className="[&_.ql-editor]:min-h-[4.5rem] [&_.ql-editor]:max-h-[7.5rem] [&_.ql-editor]:overflow-y-auto"
                  />
                </div>
              </FormLayout>
            </div>

            <div className="sticky bottom-0 z-10 bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  value={values.id ? "Update" : "Save"}
                  variant="primary"
                  onClick={handleSubmit}
                  loading={loading}
                />
                <Button
                  type="button"
                  disabled={loading}
                  value="Cancel"
                  variant="secondary"
                  onClick={onClose}
                />
              </div>
            </div>

            <Modal
              open={showAddFirstTimer}
              onClose={() => setShowAddFirstTimer(false)}
            >
              <SoulsWonForm
                onSubmit={(soulValues: ISoulsWonForm) =>
                  createFirstTimer({ ...soulValues, lifeCenterId })
                }
                onClose={() => setShowAddFirstTimer(false)}
                editData={null}
                loading={creatingFirstTimer}
                leader={leader}
              />
            </Modal>
          </Form>
        );
      }}
    </Formik>
  );
};
