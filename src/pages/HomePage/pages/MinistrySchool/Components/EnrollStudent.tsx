import { useState } from "react";
import { Formik, Field, Form } from "formik";
import * as Yup from "yup";
import { ApiCalls } from "@/utils/apiFetch"; // Assuming this is where your API calls are
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { ApiCreationCalls } from "@/utils/apiPost";

// Type for selectedClass and Enrollment Form Props
interface SelectedClass {
  id: number;
  title: string;
  eligibility: "Members" | "Non_Members" | "Both";
}

interface EnrollStudentProps {
  selectedClass: SelectedClass;
  onClose: () => void;
}

const EnrollStudent: React.FC<EnrollStudentProps> = ({ selectedClass, onClose }) => {
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(false);
  const apiPost = new ApiCreationCalls();

  // Validation Schema
  const validationSchema = Yup.object({
    firstName: Yup.string().when("isMember", {
      is: (isMember: boolean) => !isMember,
      then: () => Yup.string().required("First name is required"),
    }),
    lastName: Yup.string().when("isMember", {
      is: (isMember: boolean) => !isMember,
      then: () => Yup.string().required("Last name is required"),
    }),
    email: Yup.string().email("Invalid email format").required("Email is required"),
    phone: Yup.string().required("Phone number is required"),
  });

  const initialValues = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    isMember: false,
  };

  // Enroll Function
  const handleSubmit = async (values: any) => {
    setLoading(true);

    // Prepare the payload including the selected class ID
    const payload = {
      ...values,
      courseId: selectedClass.id, // Add classId to the payload
      userId:1
    };

    try {
      const response = await apiPost.enrollUser(payload); // Adjust according to your API structure
      if (response.success) {
        console.log("Student enrolled successfully", response.data);
        onClose(); // Close modal after successful enrollment
      } else {
        console.error("Error enrolling student:", response?.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error in enrolling student:", error);
    } finally {
      setLoading(false);
    }
  };

  // Form UI Rendering
  return (
    <div className="bg-white p-6 rounded-lg md:w-[45rem] text-dark900 space-y-4 overflow-auto">
      <div className="text-lg font-bold">
        {selectedClass?.eligibility === "Both" ? "Enroll Student" : `Enroll as ${selectedClass?.eligibility}`}
      </div>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, errors, touched }) => (
          <Form className="space-y-4">
            {/* Is Member Question */}
            {selectedClass?.eligibility === "Both" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-dark900">
                  Is the student a member?
                </label>
                <div className="flex gap-4">
                  <div>
                    <Field
                      type="radio"
                      name="isMember"
                      value={true}
                      onChange={() => setIsMember(true)}
                      className="mr-2"
                    />
                    Yes
                  </div>
                  <div>
                    <Field
                      type="radio"
                      name="isMember"
                      value={false}
                      onChange={() => setIsMember(false)}
                      className="mr-2"
                    />
                    No
                  </div>
                </div>
              </div>
            )}

            {/* First and Last Name - Only for Non-Members */}
            {!values.isMember && (
              <div className="grid lg:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-dark900">
                    First Name *
                  </label>
                  <Field
                    type="text"
                    id="firstName"
                    name="firstName"
                    className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                    placeholder="Enter first name"
                  />
                  {errors.firstName && touched.firstName && (
                    <div className="text-red-600 text-xs">{errors.firstName}</div>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-dark900">
                    Last Name *
                  </label>
                  <Field
                    type="text"
                    id="lastName"
                    name="lastName"
                    className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                    placeholder="Enter last name"
                  />
                  {errors.lastName && touched.lastName && (
                    <div className="text-red-600 text-xs">{errors.lastName}</div>
                  )}
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-dark900">
                Email *
              </label>
              <Field
                type="email"
                id="email"
                name="email"
                className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                placeholder="Enter email"
              />
              {errors.email && touched.email && (
                <div className="text-red-600 text-xs">{errors.email}</div>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium text-dark900">
                Phone Number *
              </label>
              <Field
                type="text"
                id="phone"
                name="phone"
                className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                placeholder="Enter phone number"
              />
              {errors.phone && touched.phone && (
                <div className="text-red-600 text-xs">{errors.phone}</div>
              )}
            </div>

            {/* Enroll Button */}
            <div className="flex gap-4 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="border border-primary text-primary px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-primary text-white px-6 py-2 rounded-lg"
                disabled={loading}
              >
                {loading ? "Enrolling..." : "Enroll"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default EnrollStudent;
