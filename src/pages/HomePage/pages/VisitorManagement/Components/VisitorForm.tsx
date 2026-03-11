import { Button } from "@/components/Button";
import { CountryField } from "@/components/fields/CountryField";
import { FormikInputDiv } from "@/components/FormikInputDiv";
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
import { Field, Form, Formik, useFormikContext } from "formik";
import { date, object, string } from "yup";
import React from "react";

type SyncEventDateFormValues = {
  visit?: {
    eventId?: string | number;
  };
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

interface IProps {
  onClose: () => void;
  selectedVisitor?: IVisitorForm;
  onSubmit: (value: IVisitorForm & { id?: string }) => void;
  loading: boolean;
  showHeader?: boolean; // TODO: RRemove after tomorrow's event
}

const VisitorFormComponent = ({
  onClose,
  selectedVisitor,
  onSubmit,
  loading,
  showHeader = true,
}: IProps) => {
  const { eventsOptions, membersOptions } = useStore();
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
        // validationSchema={validationSchema}
        enableReinitialize={true}
        onSubmit={onSubmit}
      >
        {({ setFieldValue, values }) => (
          <Form className="flex h-[80vh] w-full flex-col overflow-hidden rounded-lg bg-white shadow-sm">
            <SyncEventDate eventsOptions={eventsOptions} />
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
                <NameInfo prefix="personal_info" />
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
                <ContactsSubForm prefix="contact_info" />
                <Field
                  component={FormikInputDiv}
                  label="Adress *"
                  placeholder="123 Main St"
                  name={`contact_info.address`}
                  id={`contact_info.address`}
                />
                <Field
                  component={FormikSelectField}
                  options={eventsOptions}
                  label="Event"
                  placeholder="Select event"
                  name="visit.eventId"
                  id="visit.eventId"
                />
                <Field
                  component={FormikInputDiv}
                  label="Visit Date *"
                  placeholder="Enter visit date"
                  name={`visit.date`}
                  id={`visit.date`}
                  type="date"
                />
                <Field
                  component={FormikSelectField}
                  options={howHeardOptions}
                  label="How did you hear about us *"
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
  personal_info: INameInfo & {
    gender?: string;
    marital_status?: string;
    nationality?: string;
  };
  contact_info: IContactsSubForm & { address: string };
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
  personal_info: {
    ...NameInfo.initialValues,
    gender: "",
    marital_status: "",
    nationality: "",
  },
  contact_info: { ...ContactsSubForm.initialValues, address: "" },
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

export const VisitorForm = Object.assign(VisitorFormComponent, {
  initialValues,
  validationSchema,
});
