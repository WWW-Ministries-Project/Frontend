import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { FormHeader } from "@/components/ui";
import { useAuth } from "@/context/AuthWrapper";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { useStore } from "@/store/useStore";
import { api, formatInputDate } from "@/utils";
import { showNotification } from "@/pages/HomePage/utils";
import { Field, Form, Formik, useFormikContext } from "formik";
import { useEffect, useMemo } from "react";
import { number, object, string } from "yup";

export type AttendanceGroup = "ADULTS" | "CHILDREN" | "BOTH";

export interface IChurchAttendanceForm {
  eventId: string;
  date: string;
  group: AttendanceGroup;
  adultMale?: number;
  adultFemale?: number;
  childrenMale?: number;
  childrenFemale?: number;
  youthMale?: number;
  youthFemale?: number;
  visitingPastors?: number;
  recordedBy: string;
  lastUpdatedBy: string;
  id?: string | number;
  event_name?: string;
  recordedByName?: string;
}

interface AttendanceEventOption {
  value: string | number;
  label: string;
  date?: string;
}

const AutoPopulateAttendanceDate = ({
  eventsOptions,
}: {
  eventsOptions: AttendanceEventOption[];
}) => {
  const { values, setFieldValue } = useFormikContext<IChurchAttendanceForm>();

  useEffect(() => {
    if (!values.eventId) return;

    const selectedEvent = eventsOptions?.find(
      (event) => String(event.value) === String(values.eventId)
    );

    if (selectedEvent?.date) {
      setFieldValue("date", formatInputDate(selectedEvent.date));
    }
  }, [values.eventId, eventsOptions, setFieldValue]);

  return null;
};

interface Props {
  onClose: () => void;
  initialData?: IChurchAttendanceForm;
  loading?: boolean;
  refetch?: () => void;
}

const ChurchAttendanceFormComponent = ({
  onClose,
  initialData,
  loading,
  refetch,
}: Props) => {
  const initialValues = useMemo<IChurchAttendanceForm>(() => {
    const group = initialData?.group;
    const normalizedGroup: AttendanceGroup =
      group === "ADULTS" || group === "CHILDREN" || group === "BOTH"
        ? group
        : "BOTH";
    return { ...defaultValues, ...initialData, group: normalizedGroup };
  }, [initialData]);

  const { eventsOptions } = useStore();
  const { user } = useAuth();

  const {
    postData,
    data: createdAttendance,
    error: postError,
    loading: postLoading,
  } = usePost(api.post.recordChurchAttendance);
  const {
    updateData,
    data: updatedAttendance,
    error: putError,
    loading: putLoading,
  } = usePut(api.put.updateChurchAttendance);

  useEffect(() => {
    if (!createdAttendance && !updatedAttendance) return;

    showNotification(
      initialData ? "Attendance updated successfully." : "Attendance recorded successfully.",
      "success"
    );
    if (refetch) refetch();
    onClose();
  }, [createdAttendance, initialData, onClose, refetch, updatedAttendance]);

  useEffect(() => {
    if (!postError && !putError) return;

    const message =
      postError?.message ||
      putError?.message ||
      "Unable to save attendance. Please try again.";
    showNotification(message, "error", "Attendance");
  }, [postError, putError]);

  const onSubmit = (values: IChurchAttendanceForm) => {
    const payload = {
      eventId: values.eventId,
      date: values.date,
      group: "BOTH" as const,
      adultMale: values.adultMale ?? 0,
      adultFemale: values.adultFemale ?? 0,
      childrenMale: values.childrenMale ?? 0,
      childrenFemale: values.childrenFemale ?? 0,
      youthMale: values.youthMale ?? 0,
      youthFemale: values.youthFemale ?? 0,
      visitingPastors: values.visitingPastors ?? 0,
      recordedBy: user.id,
      recordedByName: user.name,
    };

    if (initialData && initialData.id) {
      updateData(payload, { id: String(initialData.id) });
    } else {
      postData(payload);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ values, handleSubmit }) => (
          <>
            <AutoPopulateAttendanceDate eventsOptions={eventsOptions} />
            <Form className="flex flex-col">
              <div className="sticky top-0 z-10">
                <FormHeader>
                  <p className="text-lg font-semibold">
                    {initialData ? "Edit Attendance" : "Record Attendance"}
                  </p>
                  <p className="text-sm text-white">
                    Capture attendance details for the service.
                  </p>
                </FormHeader>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    component={FormikSelectField}
                    label="Event *"
                    id="eventId"
                    name="eventId"
                    options={eventsOptions}
                    placeholder="Select event"
                  />
                  <Field
                    component={FormikInputDiv}
                    type="date"
                    label="Date *"
                    id="date"
                    name="date"
                    value={formatInputDate(values.date)}
                  />
                </div>

                {/* <Field
                  component={FormikSelectField}
                  label="Group *"
                  id="group"
                  name="group"
                  options={[{ label: "Both", value: "BOTH" }]}
                  // disabled
                /> */}

                {/* {(values.group === "ADULTS" || values.group === "BOTH") && ( */}
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      component={FormikInputDiv}
                      type="number"
                      label="Adult Male"
                      id="adultMale"
                      name="adultMale"
                    />
                    <Field
                      component={FormikInputDiv}
                      type="number"
                      label="Adult Female"
                      id="adultFemale"
                      name="adultFemale"
                    />
                  </div>
                {/* )} */}

                {/* {(values.group === "CHILDREN" || values.group === "BOTH") && ( */}
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      component={FormikInputDiv}
                      type="number"
                      label="Children Male"
                      id="childrenMale"
                      name="childrenMale"
                    />
                    <Field
                      component={FormikInputDiv}
                      type="number"
                      label="Children Female"
                      id="childrenFemale"
                      name="childrenFemale"
                    />
                  </div>
                {/* )} */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    component={FormikInputDiv}
                    type="number"
                    label="Youth Male"
                    id="youthMale"
                    name="youthMale"
                  />
                  <Field
                    component={FormikInputDiv}
                    type="number"
                    label="Youth Female"
                    id="youthFemale"
                    name="youthFemale"
                  />
                  <Field
                    component={FormikInputDiv}
                    type="number"
                    label="Visiting Pastors"
                    id="visitingPastors"
                    name="visitingPastors"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 z-10 bg-white border-t px-6 py-4">
                <div className="flex justify-end gap-3">
                  <Button
                    value="Save"
                    variant="primary"
                    type="submit"
                    loading={loading || postLoading || putLoading}
                    onClick={handleSubmit}
                  />
                  <Button
                    value="Cancel"
                    variant="secondary"
                    onClick={onClose}
                  />
                </div>
              </div>
            </Form>
          </>
        )}
      </Formik>
    </div>
  );
};

const defaultValues: IChurchAttendanceForm = {
  eventId: "",
  date: "",
  group: "BOTH",
  adultMale: 0,
  adultFemale: 0,
  childrenMale: 0,
  childrenFemale: 0,
  youthMale: 0,
  youthFemale: 0,
  visitingPastors: 0,
  recordedBy: "Current User",
  lastUpdatedBy: "Current User",
};

const validationSchema = object({
  eventId: string().required("Event is required"),
  date: string().required("Date is required"),
  group: string().required(),
  adultMale: number().min(0),
  adultFemale: number().min(0),
  childrenMale: number().min(0),
  childrenFemale: number().min(0),
  youthMale: number().min(0),
  youthFemale: number().min(0),
  visitingPastors: number().min(0),
});

export const ChurchAttendanceForm = Object.assign(
  ChurchAttendanceFormComponent,
  { defaultValues, validationSchema }
);

export default ChurchAttendanceForm;
