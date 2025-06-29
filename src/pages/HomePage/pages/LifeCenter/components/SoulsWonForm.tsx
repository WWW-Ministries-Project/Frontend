import { Button } from "@/components";
import { ContactInput, IContactInput } from "@/components/ContactInput";
import { CountryField } from "@/components/fields/CountryField";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { INameInfo, NameInfo } from "@/components/subform";
import { FormHeader, FormLayout } from "@/components/ui";
import { useStore } from "@/store/useStore";
import { Field, Form, Formik } from "formik";
import { useMemo } from "react";
import { object, string } from "yup";

interface IProps {
  onSubmit: (values: ISoulsWonForm) => void;
  onClose: () => void;
  editData: ISoulsWonForm | null;
  loading: boolean;
}
export const SoulsWonForm = ({
  onSubmit,
  onClose,
  editData,
  loading,
}: IProps) => {
  const { membersOptions } = useStore();

  const initial = useMemo(
    () => ({
      ...(editData || initialValues),

      phone: {
        //todo: check the data and correct this
        // @ts-expect-error error from BE
        number: editData?.contact_number ?? "",
        country_code: ContactInput.initialValues.country_code,
      },
    }),
    [editData, initialValues]
  );

  return (
    <Formik
      initialValues={initial}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        onSubmit(values);
      }}
    >
      {({ handleSubmit }) => (
        <Form className="space-y-6 w-[90vw] sm:w-[70vw] xl:w-[50vw] p-6">
          <FormLayout>
            <FormHeader>{initial.id ? "Update" : "Add"} a Soul</FormHeader>
            <NameInfo />
            <ContactInput />
            <Field
              name="contact_email"
              component={FormikInputDiv}
              label="Email"
              id="contact_email"
              placeholder="Email"
            />
            <CountryField name="country" />
            <Field
              name="city"
              component={FormikInputDiv}
              label="City *"
              id="city"
              placeholder="Enter city"
            />
            <Field
              type="date"
              name="date_won"
              component={FormikInputDiv}
              label="Date Won *"
              id="date_won"
              placeholder="Select date"
            />
            <Field
              name="wonById"
              component={FormikSelectField}
              options={membersOptions}
              label="Won Byc *"
              id="wonById"
              placeholder="Soul won by"
            />
          </FormLayout>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="submit"
              disabled={loading}
              value={initial.id ? "Update" : "Save"}
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
            />
            <Button
              type="submit"
              disabled={loading}
              value="Cancel"
              variant="secondary"
              onClick={onClose}
            />
          </div>
        </Form>
      )}
    </Formik>
  );
};
export interface ISoulsWonForm extends INameInfo {
  contact_email: string;
  country: string;
  phone: IContactInput;
  city: string;
  date_won: string;
  wonById: string;
  id: string;
  lifeCenterId: string;
}
const initialValues: ISoulsWonForm = {
  ...NameInfo.initialValues,
  phone: ContactInput.initialValues,
  contact_email: "",
  country: "",
  city: "",
  date_won: "",
  wonById: "",
  id: "",
  lifeCenterId: "",
};

const validationSchema = object().shape({
  ...NameInfo.validationSchema,
  contact_email: string().email(),
  country: string().required("required"),
  city: string().required("required"),
  date_won: string().required("required"),
  wonById: string().required("required"),
  phone: object(ContactInput.validationSchema),
});
