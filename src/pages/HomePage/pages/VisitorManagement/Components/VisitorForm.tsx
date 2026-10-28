import { Button } from "@/components/Button";
import { BranchSelectField } from "@/components/BranchSelectField";
import { CountryField } from "@/components/fields/CountryField";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import { useFetch } from "@/CustomHooks/useFetch";
import MultiSelect from "@/components/MultiSelect";
import FormikSelectField from "@/components/FormikSelect";
import {
  ContactsSubForm,
  IContactsSubForm,
  INameInfo,
  NameInfo,
} from "@/components/subform";
import { FormHeader, FormLayout } from "@/components/ui";
import { useStore } from "@/store/useStore";
import { api, EventResponseType, formatDate } from "@/utils";
import { Field, Form, Formik, useFormikContext } from "formik";
import { date, mixed, object, string } from "yup";
import React from "react";
import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";

type SyncEventDateFormValues = {
  visit?: {
    eventId?: string | number;
    date?: string;
  };
};

type SyncClergyFieldsFormValues = {
  isClergy?: string;
  clergy_info?: {
    churchName?: string;
    churchLocation?: string;
    churchRole?: string;
  };
};

type VisitorEventOption = {
  value: string;
  label: string;
  date?: string;
};

const genderOptions = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
];

const maritalStatusOptions = [
  { label: "Single", value: "SINGLE" },
  { label: "Married", value: "MARRIED" },
  { label: "Divorced", value: "DIVORCED" },
  { label: "Widow", value: "WIDOW" },
  { label: "Widower", value: "WIDOWER" },
];

const clergyOptions = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

// Monday–Sunday ISO week bounds for a yyyy-mm-dd string.
const weekBounds = (isoDate: string): { from: string; to: string } | null => {
  if (!isoDate) return null;
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(
      x.getDate()
    ).padStart(2, "0")}`;
  return { from: fmt(monday), to: fmt(sunday) };
};

const mapEventOptions = (events: EventResponseType[]): VisitorEventOption[] =>
  events.map((event) => ({
    value: String(event.id),
    label: `${event.name || "Untitled event"} - ${formatDate(event.start_date)}`,
    date: event.start_date,
  }));

const SyncEventDate = ({ eventsOptions }: { eventsOptions: { value: string | number; date?: string }[] }) => {
  const { values, setFieldValue } = useFormikContext<SyncEventDateFormValues>();

  React.useEffect(() => {
    const eventId = values?.visit?.eventId;
    if (!eventId) return;

    const selected = eventsOptions.find(
      e => String(e.value) === String(eventId)
    );

    if (selected?.date) {
      const formattedDate = selected.date.split("T")[0];
      setFieldValue("visit.date", formattedDate);
    }
  }, [values?.visit?.eventId, eventsOptions, setFieldValue]);

  return null;
};

const EventSelectionFields = () => {
  const { values } = useFormikContext<SyncEventDateFormValues>();
  const visitDate = values?.visit?.date ? String(values.visit.date) : "";
  const selectedEventId = values?.visit?.eventId
    ? String(values.visit.eventId)
    : "";

  const [eventSearch, setEventSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(eventSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [eventSearch]);

  const week = weekBounds(visitDate);
  const weekFrom = week?.from;
  const weekTo = week?.to;
  const eventQuery = React.useMemo(() => {
    const query: Record<string, string> = {};
    if (debouncedSearch) {
      query.q = debouncedSearch;
    } else if (weekFrom && weekTo) {
      query.from = weekFrom;
      query.to = weekTo;
    }
    if (selectedEventId) query.includeEventId = selectedEventId;
    return query;
  }, [debouncedSearch, weekFrom, weekTo, selectedEventId]);
  const { data: eventOptionsResponse, loading: eventOptionsLoading } = useFetch(
    api.fetch.fetchEventOptions,
    eventQuery
  );

  const eventRecords = React.useMemo(
    () =>
      Array.isArray(eventOptionsResponse?.data) ? eventOptionsResponse.data : [],
    [eventOptionsResponse?.data]
  );
  const eventOptions = React.useMemo(
    () => mapEventOptions(eventRecords),
    [eventRecords]
  );

  const eventHelperText = eventOptionsLoading
    ? "Loading events..."
    : debouncedSearch
      ? eventOptions.length > 0
        ? `Showing events matching "${debouncedSearch}".`
        : `No events match "${debouncedSearch}".`
      : visitDate
        ? `Showing events for the week of ${visitDate}. Type to search all events.`
        : "Showing all events. Type to search by name.";

  return (
    <>
      <SyncEventDate eventsOptions={eventOptions} />
      <div className="md:col-span-2 rounded-lg border border-lightGray/70 bg-lightGray/20 p-4">
        <div className="mb-4">
          <p className="text-sm font-semibold text-primary">Visit Event</p>
          <p className="text-xs text-primaryGray">
            Pick a visit date to see events for that week, or search by name.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="visitor-event-search"
              className="text-sm font-medium text-primary"
            >
              Search events
            </label>
            <input
              id="visitor-event-search"
              type="text"
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              placeholder="Search events by name"
              className="w-full rounded-lg border border-lightGray px-3 py-2 text-sm"
            />
          </div>
          <Field
            component={FormikSelectField}
            options={eventOptions}
            label="Event"
            placeholder={
              eventOptionsLoading ? "Loading events..." : "Select event"
            }
            name="visit.eventId"
            id="visit.eventId"
            searchable={false}
            disabled={eventOptionsLoading}
            helperText={eventHelperText}
          />
        </div>
      </div>
    </>
  );
};

const SyncClergyFields = () => {
  const { values, setFieldValue } = useFormikContext<SyncClergyFieldsFormValues>();

  React.useEffect(() => {
    if (values?.isClergy === "yes") return;

    if (values?.clergy_info?.churchName) {
      setFieldValue("clergy_info.churchName", "");
    }

    if (values?.clergy_info?.churchLocation) {
      setFieldValue("clergy_info.churchLocation", "");
    }

    if (values?.clergy_info?.churchRole) {
      setFieldValue("clergy_info.churchRole", "");
    }
  }, [
    setFieldValue,
    values?.isClergy,
    values?.clergy_info?.churchLocation,
    values?.clergy_info?.churchName,
    values?.clergy_info?.churchRole,
  ]);

  return null;
};

interface IProps {
  onClose: () => void;
  selectedVisitor?: IVisitorForm;
  onSubmit: (value: IVisitorForm & { id?: string }) => void;
  loading: boolean;
  showHeader?: boolean; // TODO: RRemove after tomorrow's event
  // Public visitor registration: only first name is required.
  minimalValidation?: boolean;
}

const VisitorFormComponent = ({
  onClose,
  selectedVisitor,
  onSubmit,
  loading,
  showHeader = true,
  minimalValidation = false,
}: IProps) => {
  const { membersOptions } = useStore();
  const responsibleMemberOptions = React.useMemo(
    () =>
      membersOptions.map((member) => ({
        label: member.label,
        value: String(member.value),
      })),
    [membersOptions]
  );

  return (
    <div className="bg-white  rounded-lg w-full  mx-auto">
      <Formik
        initialValues={selectedVisitor || initialValues}
        validate={minimalValidation ? undefined : validateVisitorForm}
        validationSchema={
          minimalValidation ? registrationValidationSchema : validationSchema
        }
        enableReinitialize={true}
        onSubmit={onSubmit}
      >
        {({ setFieldValue, values, errors }) => (
          <Form className="flex h-[80vh] w-full flex-col overflow-hidden rounded-lg bg-white shadow-sm">
            <SyncClergyFields />
            {showHeader && (
              <div className="sticky top-0 z-10">
                <FormHeader>
                  <p className="text-lg font-semibold">Visitor Registration</p>
                  <p className="text-sm text-white">
                    Provide the details of the new soul you&apos;ve connected
                    with.
                  </p>
                </FormHeader>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <FormLayout>
                {(
                  <BranchSelectField
                    value={values.branch_id}
                    onChange={(v) => setFieldValue("branch_id", v)}
                    required
                    error={errors.branch_id as string | undefined}
                    className="md:col-span-2"
                  />
                )}
                <NameInfo
                  prefix="personal_info"
                  showRequiredMarkers={!minimalValidation}
                />
                <Field
                  component={FormikSelectField}
                  label="Gender"
                  options={genderOptions}
                  name="personal_info.gender"
                  id="personal_info.gender"
                  placeholder="Select gender"
                />
                <Field
                  component={FormikSelectField}
                  label="Marital Status"
                  options={maritalStatusOptions}
                  name="personal_info.marital_status"
                  id="personal_info.marital_status"
                  placeholder="Select marital status"
                />
                <CountryField
                  prefix="personal_info"
                  label="Nationality"
                  placeholder="Select nationality"
                />
                <ContactsSubForm
                  prefix="contact_info"
                  showRequiredMarkers={!minimalValidation}
                />
                <Field
                  component={FormikInputDiv}
                  label={`Adress${minimalValidation ? "" : " *"}`}
                  placeholder="123 Main St"
                  name={`contact_info.address`}
                  id={`contact_info.address`}
                />
                <div className="md:col-span-2 rounded-lg border border-lightGray/70 bg-lightGray/20 p-4">
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-primary">
                      Clergy Information
                    </p>
                    <p className="text-xs text-primaryGray">
                      If the visitor is clergy, add their church details.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      component={FormikSelectField}
                      options={clergyOptions}
                      label="Is the visitor clergy?"
                      placeholder="Select an option"
                      name="isClergy"
                      id="isClergy"
                    />
                    {values.isClergy === "yes" ? (
                      <>
                        <Field
                          component={FormikInputDiv}
                          label={`Church${minimalValidation ? "" : " *"}`}
                          placeholder="Enter church name"
                          name="clergy_info.churchName"
                          id="clergy_info.churchName"
                        />
                        <Field
                          component={FormikInputDiv}
                          label={`Church Location${minimalValidation ? "" : " *"}`}
                          placeholder="Enter church location"
                          name="clergy_info.churchLocation"
                          id="clergy_info.churchLocation"
                        />
                        <Field
                          component={FormikInputDiv}
                          className="md:col-span-2"
                          label="Role in the Church (Optional)"
                          placeholder="Enter church role"
                          name="clergy_info.churchRole"
                          id="clergy_info.churchRole"
                        />
                      </>
                    ) : null}
                  </div>
                </div>
                <EventSelectionFields />
                <Field
                  component={FormikInputDiv}
                  label={`Visit Date${minimalValidation ? "" : " *"}`}
                  placeholder="Enter visit date"
                  name={`visit.date`}
                  id={`visit.date`}
                  type="date"
                />
                <Field
                  component={FormikSelectField}
                  options={howHeardOptions}
                  label={`How did you hear about us${minimalValidation ? "" : " *"}`}
                  placeholder="Enter visit date"
                  name={`visit.howHeard`}
                  id={`visit.howHeard`}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-primary">
                    Responsible Members (Optional)
                  </label>
                  <MultiSelect
                    options={responsibleMemberOptions}
                    selectedValues={values.responsibleMembers || []}
                    onChange={(selectedValues) =>
                      setFieldValue("responsibleMembers", selectedValues)
                    }
                    placeholder="Assign member(s)"
                    emptyMsg="No member assigned"
                  />
                </div>
                <div className="flex items-center">
                  <Field
                    type="checkbox"
                    id="consentToContact"
                    name="consentToContact"
                    className="mr-2"
                  />
                  <label htmlFor="consentToContact" className="text-sm">
                    I consent to being contacted
                  </label>
                </div>
                <div className="flex items-center">
                  <Field
                    type="checkbox"
                    id="membershipWish"
                    name="membershipWish"
                    className="mr-2"
                  />
                  <label htmlFor="membershipWish" className="text-sm">
                    I wish to become a member
                  </label>
                </div>
              </FormLayout>
            </div>
            <div className="sticky bottom-0 z-10 bg-white border-t border-gray-100 px-6 py-4">
              <div className="flex justify-end gap-3">
                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading}
                  value="Submit"
                  variant={"primary"}
                />
                <Button
                  onClick={onClose}
                  value="Cancel"
                  variant={"secondary"}
                  disabled={loading}
                />
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

const howHeardOptions = [
  { label: "Friend", value: "friend" },
  { label: "Advertisement", value: "advertisement" },
  { label: "Social Media", value: "social_media" },
  { label: "Other", value: "other" },
];

export interface IVisitorForm {
  branch_id: number | "";
  personal_info: INameInfo & {
    gender?: string;
    marital_status?: string;
    nationality?: string;
  };
  contact_info: IContactsSubForm & { address: string };
  isClergy: string;
  clergy_info: {
    churchName: string;
    churchLocation: string;
    churchRole: string;
  };
  visit: {
    date: string;
    howHeard: string;
    eventId: string;
  };
  consentToContact: string;
  membershipWish: string;
  responsibleMembers: string[];
}

const initialValues: IVisitorForm = {
  branch_id: "",
  personal_info: {
    ...NameInfo.initialValues,
    gender: "",
    marital_status: "",
    nationality: "",
  },
  contact_info: { ...ContactsSubForm.initialValues, address: "" },
  isClergy: "no",
  clergy_info: {
    churchName: "",
    churchLocation: "",
    churchRole: "",
  },
  visit: {
    date: "",
    howHeard: "",
    eventId: "",
  },
  consentToContact: "",
  membershipWish: "",
  responsibleMembers: [],
};

const validationSchema = object({
  branch_id: mixed().when([], {
    is: () => useBranchStore.getState().activeBranchId === ALL_BRANCHES,
    then: (schema) => schema.required("Branch is required"),
    otherwise: (schema) => schema.optional(),
  }),
  personal_info: object().shape({
    ...NameInfo.validationSchema,
    gender: string(),
    marital_status: string(),
    nationality: string(),
  }),
  contact_info: object().shape({
    ...ContactsSubForm.validationSchema,
    address: string().required(),
  }),
  visit: object().shape({
    date: date().required("Visit date is required"),
    howHeard: string().required("How did you hear about us?"),
  }),
});

// Public registration portal: only first name is required.
const registrationValidationSchema = object({
  personal_info: object().shape({
    first_name: string().required("First name is required"),
  }),
});

const validateVisitorForm = (values: IVisitorForm) => {
  const errors: {
    branch_id?: string;
    clergy_info?: {
      churchName?: string;
      churchLocation?: string;
    };
  } = {};

  if (useBranchStore.getState().activeBranchId === ALL_BRANCHES && values.branch_id === "") {
    errors.branch_id = "Branch is required";
  }

  if (values.isClergy !== "yes") {
    return errors;
  }

  const churchName = values.clergy_info.churchName?.trim();
  const churchLocation = values.clergy_info.churchLocation?.trim();

  if (!churchName || !churchLocation) {
    errors.clergy_info = {};
  }

  if (!churchName) {
    errors.clergy_info = {
      ...errors.clergy_info,
      churchName: "Church is required",
    };
  }

  if (!churchLocation) {
    errors.clergy_info = {
      ...errors.clergy_info,
      churchLocation: "Church location is required",
    };
  }

  return errors;
};

export const VisitorForm = Object.assign(VisitorFormComponent, {
  initialValues,
  validationSchema,
});
