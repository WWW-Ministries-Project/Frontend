import { Button } from "@/components";
import { ContactInput, IContactInput } from "@/components/ContactInput";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { Field, Form, Formik } from "formik";
import { object, string } from "yup";

interface RegisterMemberProps {
  memberDetails: {
    first_name: string;
    last_name: string;
    other_name: string;
    gender: string;
    new_member: boolean;
    phone_number: string;
  };
  name: string;
  loading: boolean;
  onSubmit: (value: IRegisterMember) => void;
}

const RegisterMember: React.FC<RegisterMemberProps> = ({
  memberDetails,
  name,
  loading,
  onSubmit,
}) => {
  const handleSubmit = (value: IRegisterMember) => {
    onSubmit(value);
  };
  const handleCancel = () => {
    window.location.reload();
  };
  return (
    <div className="text-white">
      <h2 className="H400">Welcome to {name}</h2>
      <p className="text-sma ">
        Member is new Please fill in the form below to capture attendance
      </p>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={(values) => {
          handleSubmit(values);
        }}
      >
        {({ handleSubmit }) => (
          <Form className="mt-4 flex flex-col gap-4 text-black">
            <Field
              component={FormikInputDiv}
              type="text"
              id="first_name"
              name="first_name"
              label="First Name"
              placeholder="Enter first name"
              value={memberDetails.first_name}
            />
            <Field
              component={FormikInputDiv}
              type="text"
              id="last_name"
              name="last_name"
              label="Last Name *"
              placeholder="Enter last name"
              value={memberDetails.last_name}
            />
            <Field
              component={FormikInputDiv}
              type="text"
              id="other_name"
              name="other_name"
              label="Other Name"
              placeholder="Enter other name"
              value={memberDetails.other_name}
            />
            {/* <InputDiv type='text' id='phone_number' label="Phone Number" placeholder='Enter phone number' value={memberDetails.phone_number} onChange={handleChange}  /> */}

            <ContactInput
              label="Phone number *"
              placeholder="Enter your phone number"
              // value={memberDetails.phone_number}
              // onChange={handleChange}
            />
            <Field
              component={FormikSelectField}
              options={[
                { name: "Male", value: "Male" },
                { name: "Female", value: "Female" },
              ]}
              id="gender"
              name="gender"
              label="Gender *"
              placeholder="Select Gender"
            />
            <div className="flex justify-between my-4">
              <Button value="Cancel" variant="ghost" onClick={handleCancel} />
              <Button
                value="Save"
                type="submit"
                variant="primary"
                loading={loading}
                onClick={() => {
                  console.log("clicked");
                  handleSubmit();
                }}
              />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};
interface IRegisterMember {
  first_name: string;
  last_name: string;
  other_name: string;
  gender: string;
  new_member: boolean;
  phone: IContactInput;
}

const initialValues: IRegisterMember = {
  first_name: "",
  last_name: "",
  other_name: "",
  gender: "",
  new_member: true,
  phone: ContactInput.initialValues,
};

const validationSchema = object().shape({
  first_name: string(),
  last_name: string().required("Last name is required"),
  other_name: string(),
  gender: string().required("Gender is required"),
  phone: object().shape(ContactInput.validationSchema),
});

export default RegisterMember;
