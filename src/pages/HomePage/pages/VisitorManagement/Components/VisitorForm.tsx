import { Button } from "@/components/Button";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import {
  ContactsSubForm,
  IContactsSubForm,
  INameInfo,
  NameInfo,
} from "@/components/subform";
import { FormLayout } from "@/components/ui";
import { useStore } from "@/store/useStore";
import { Field, Formik } from "formik";
import { date, object, string } from "yup";

interface IProps {
  onClose: () => void;
  selectedVisitor?: IVisitorForm;
  onSubmit: (value: IVisitorForm & { id?: string }) => void;
  loading: boolean;
}

const VisitorFormComponent = ({
  onClose,
  selectedVisitor,
  onSubmit,
  loading,
}: IProps) => {
  const { eventsOptions } = useStore();

  return (
    <div className="bg-white p-6 rounded-lg w-full max-w-3xl mx-auto">
      <div className="font-bold text-lg mb-4">Visitor Registration</div>
      <Formik
        initialValues={selectedVisitor || initialValues}
        // validationSchema={validationSchema}
        enableReinitialize={true}
        onSubmit={onSubmit}
      >
        {({ handleSubmit }) => (
          <>
            <FormLayout>
              <NameInfo prefix="personal_info" />
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
                name="eventId"
                id="eventId"
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
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                loading={loading}
                disabled={loading}
                value="Submit"
                variant={"primary"}
              />
              <Button
                onClick={onClose}
                value="Cancel"
                variant={"ghost"}
                disabled={loading}
              />
            </div>
          </>
        )}
      </Formik>
    </div>
  );
};

const howHeardOptions = [
  { name: "Friend", value: "friend" },
  { name: "Advertisement", value: "advertisement" },
  { name: "Social Media", value: "social_media" },
  { name: "Other", value: "other" },
];

export interface IVisitorForm {
  personal_info: INameInfo;
  contact_info: IContactsSubForm & { address: string };
  visit: {
    date: string;
    howHeard: string;
    eventId: string;
  };
  consentToContact: string;
  membershipWish: string;
}

const initialValues: IVisitorForm = {
  personal_info: NameInfo.initialValues,
  contact_info: { ...ContactsSubForm.initialValues, address: "" },
  visit: {
    date: "",
    howHeard: "",
    eventId: "",
  },
  consentToContact: "",
  membershipWish: "",
};

const validationSchema = object({
  personal_info: object().shape(NameInfo.validationSchema),
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
