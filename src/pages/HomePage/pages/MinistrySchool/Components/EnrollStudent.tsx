import { ApiCalls } from "@/utils/api/apiFetch"; // Assuming this is where your API calls are
import { ApiCreationCalls } from "@/utils/api/apiPost";
import { Field, Form, Formik } from "formik";
import { useEffect, useState } from "react";
import Select from "react-select";
import * as Yup from "yup";

// Type for selectedClass and Enrollment Form Props
interface SelectedClass {
  id: number;
  title: string;
  eligibility: "Members" | "Non_Members" | "Both";
}

interface EnrollStudentProps {
  selectedClass: SelectedClass;
  onClose: () => void;
  fetchCohortData: () => void;
}

interface Member {
  id: number;
  name: string;
  email: string;
  user_info: {
    first_name: string;
    last_name: string;
  };
}

const EnrollStudent: React.FC<EnrollStudentProps> = ({
  selectedClass,
  onClose,
  fetchCohortData,
}) => {
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const apiPost = new ApiCreationCalls();
  const apiFetch = new ApiCalls();

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
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    phone: Yup.string(),
  });

  const initialValues = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    isMember: false,
  };

  // Fetching Members Data
  const fetchMembers = async () => {
    try {
      const response = await apiFetch.fetchMembers(); // Replace with your API endpoint
      console.log("Fetching members", response.data);

      if (response.status === 200 && Array.isArray(response.data.data)) {
        setMembers(
          response?.data?.data?.map((item: any) => ({
            id: item.id,
            name: item.name,
            email: item.email,
            user_info: {
              first_name: item.user_info?.first_name || "",
              last_name: item.user_info?.last_name || "",
            },
          })) as Member[]
        ); // Safely map and validate the response data
      } else {
        console.error("Unexpected response format: data is not an array");
      }
    } catch (error) {
      console.error("Error fetching members data:", error);
    }
  };

  useEffect(() => {
    fetchMembers(); // Fetch members when the component mounts
  }, []);

  const handleSubmit = async (values: any) => {
    setLoading(true);

    // Prepare the payload
    const payload = {
      ...values,
      courseId: selectedClass.id, // Add classId to the payload
      userId: selectedMember ? selectedMember.id : null, // Add selected member's ID if available
    };

    try {
      const response = await apiPost.enrollUser(payload);
      if (response.success) {
        console.log("Student enrolled successfully", response.data);
        onClose(); // Close modal after successful enrollment
      } else {
        console.error(
          "Error enrolling student:",
          response?.error || "Unknown error"
        );
      }
    } catch (error) {
      console.error("Error in enrolling student:", error);
    } finally {
      setLoading(false);
      onClose();
      fetchCohortData();
    }
  };

  // Handle selection from the dropdown
  const handleMemberChange = (selectedOption: any, setFieldValue: any) => {
    const member = members.find((m) => m.id === selectedOption.value);
    if (member) {
      setSelectedMember(member);
      setIsMember(true);
      // Set Formik values based on selected member
      setFieldValue("firstName", member.user_info.first_name);
      setFieldValue("lastName", member.user_info.last_name);
      setFieldValue("email", member.email);
    }
  };

  // Form UI Rendering
  return (
    <div className="bg-white p-6 rounded-lg md:w-[45rem] text-dark900 space-y-4 overflow-auto">
      <div className="text-lg font-bold">
        {selectedClass?.eligibility === "Both"
          ? "Enroll Student"
          : `Enroll as ${selectedClass?.eligibility}`}
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
                <Field
                  type="radio"
                  name="isMember"
                  value={false}
                  onChange={() => setIsMember(false)}
                  className="mr-2"
                />
              </div>
            )}

            {/* Member Dropdown */}
            {selectedClass?.eligibility !== "Non_Members" && (
              <div>
                <label
                  htmlFor="member"
                  className="text-sm font-medium text-dark900"
                >
                  Select Member
                </label>
                <Select
                  options={members?.map((member) => ({
                    value: member?.id,
                    label: member?.name,
                  }))}
                  onChange={(selectedOption) =>
                    handleMemberChange(selectedOption, setFieldValue)
                  }
                  getOptionLabel={(e: any) => `${e.label}`}
                  className="mt-1"
                />
              </div>
            )}

            {/* First Name, Last Name, Email, Phone (disabled for members) */}
            <div className="space-y-2">
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-dark900"
              >
                First Name *
              </label>
              <Field
                type="text"
                id="firstName"
                name="firstName"
                className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                placeholder="Enter first name"
                disabled={isMember}
                value={
                  selectedMember?.user_info?.first_name || values.firstName
                }
              />
              {errors.firstName && touched.firstName && (
                <div className="text-red-600 text-xs">{errors.firstName}</div>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-dark900"
              >
                Last Name *
              </label>
              <Field
                type="text"
                id="lastName"
                name="lastName"
                className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                placeholder="Enter last name"
                disabled={isMember}
                value={selectedMember?.user_info?.last_name || values.lastName}
              />
              {errors.lastName && touched.lastName && (
                <div className="text-red-600 text-xs">{errors.lastName}</div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-dark900"
              >
                Email *
              </label>
              <Field
                type="email"
                id="email"
                name="email"
                className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                placeholder="Enter email"
                disabled={isMember}
                value={selectedMember?.email || values.email}
              />
              {errors.email && touched.email && (
                <div className="text-red-600 text-xs">{errors.email}</div>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-dark900"
              >
                Phone Number
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

            {/* Submit Button */}
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
