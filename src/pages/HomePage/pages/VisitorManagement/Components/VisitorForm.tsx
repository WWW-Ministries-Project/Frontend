import { Button } from "@/components/Button";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import {
  ContactsSubForm,
  IContactsSubForm,
  INameInfo,
  NameInfo,
} from "@/components/subform";
import { FormHeader, FormLayout } from "@/components/ui";
import { useStore } from "@/store/useStore";
import { Field, Form, Formik } from "formik";
import { date, object, string } from "yup";

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
  const { eventsOptions } = useStore();

  return (
    <div className="bg-white  rounded-lg w-full  mx-auto">
      <Formik
        initialValues={selectedVisitor || initialValues}
        // validationSchema={validationSchema}
        enableReinitialize={true}
        onSubmit={onSubmit}
      >
        {({ handleSubmit }) => (
          <Form className="flex flex-col h-[80vh]  xl:w-[50vw] bg-white rounded-lg shadow-sm overflow-hidden">
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
            </div>
            <div className="sticky bottom-0 z-10 bg-white border-t border-gray-100 px-6 py-4">
              <div className="flex justify-end gap-3">
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
