import { ApiCreationCalls } from "@/utils/api/apiPost"; // Make sure this is the correct import
import { ApiUpdateCalls } from "@/utils/api/apiPut"; // Ensure you have the correct import
import { Field, Form, Formik } from "formik";
import { useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import * as Yup from "yup";

interface ClassFormProps {
  onClose: () => void;
  fetchCohortData: () => void;
  classId?: number; // Optional class ID for updating
  initialData?: any; // Initial data for updating class
  cohortId?: number; // Required cohort ID
}

const ClassForm: React.FC<ClassFormProps> = ({
  onClose,
  classId,
  initialData,
  cohortId,
  fetchCohortData,
}) => {
  const [loading, setLoading] = useState(false);
  const apiCalls = new ApiCreationCalls();
  const api = new ApiUpdateCalls();

  const initialValues = {
    name: initialData?.name || "",
    instructor: initialData?.instructor || "",
    capacity: initialData?.capacity || "",
    schedule: initialData?.schedule || "",
    classFormat: initialData?.classFormat || "Hybrid",
    location: initialData?.location || "",
    meetingLink: initialData?.meetingLink || "",
    cohortId: cohortId || "", // Add cohortId here
  };

  const validationSchema = Yup.object({
    name: Yup.string().required("Class name is required"),
    instructor: Yup.string().required("Instructor name is required"),
    capacity: Yup.number()
      .required("Capacity is required")
      .positive()
      .integer(),
    schedule: Yup.string().required("Schedule is required"),
    classFormat: Yup.string().required("Class format is required"),
    location: Yup.string().when("classFormat", {
      is: (value: any) => value === "In_Person" || value === "Hybrid",
      then: (schema) =>
        schema.required("Location is required for in-person or hybrid classes"),
    }),
    meetingLink: Yup.string().when("classFormat", {
      is: (value: any) => value === "Online" || value === "Hybrid",
      then: (schema) =>
        schema.required(
          "Meeting link is required for online or hybrid classes"
        ),
    }),
  });

  const handleSubmit = async (values: any) => {
    setLoading(true);

    // Include cohortId in the payload
    const payload = {
      ...values,
      cohortId, // Ensure cohortId is added to the payload
      // ...(classId && { id: classId }),
      id: initialData?.id,
    };

    try {
      console.log("Submit", payload);

      let response;
      if (initialData?.id) {
        // Update class if classId exists
        response = await api.updateClass(payload); // Ensure you have this method in your ApiUpdateCalls class
      } else {
        // Create class if no classId exists
        response = await apiCalls.createCourse(payload); // Ensure you have this method in your ApiCreationCalls class
      }

      if (response.success) {
        console.log("Class successfully updated/created:", response.data);
        onClose(); // Close the modal after successful submit
      } else {
        console.error(
          "Error submitting class:",
          response?.error || "Unknown error"
        );
      }
    } catch (error) {
      console.error("Error in submitting class:", error);
    } finally {
      setLoading(false);
      onClose();
      fetchCohortData();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg max-h-[90vh] md:h-full md:w-[45rem] text-dark900 space-y-4 overflow-auto">
      <div>
        <div className="text-lg font-bold">
          {initialData?.id ? "Edit Class" : "Add New Class"}
        </div>
        <div className="text-sm mb-4">
          {initialData?.id
            ? "Edit the details of the class"
            : "Create a new class for the cohort."}
        </div>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, values, setFieldValue }) => (
          <Form className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Class Name */}
              <div className="w-full">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-dark900"
                >
                  Class Name *
                </label>
                <Field
                  type="text"
                  id="name"
                  name="name"
                  className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                  placeholder="Enter class name"
                />
                {errors.name && touched.name && (
                  <div className="text-red-600 text-xs">
                    {typeof errors.name === "string" && errors.name}
                  </div>
                )}
              </div>

              {/* Instructor */}
              <div className="w-full">
                <label
                  htmlFor="instructor"
                  className="block text-sm font-medium text-dark900"
                >
                  Instructor *
                </label>
                <Field
                  type="text"
                  id="instructor"
                  name="instructor"
                  className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                  placeholder="Enter instructor name"
                />
                {errors.instructor && touched.instructor && (
                  <div className="text-red-600 text-xs">
                    {typeof errors.instructor === "string" && errors.instructor}
                  </div>
                )}
              </div>
            </div>

            {/* Capacity */}
            <div className="w-full">
              <label
                htmlFor="capacity"
                className="block text-sm font-medium text-dark900"
              >
                Capacity *
              </label>
              <Field
                type="number"
                id="capacity"
                name="capacity"
                className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                placeholder="Maximum number of students"
              />
              {errors.capacity && touched.capacity && (
                <div className="text-red-600 text-xs">{errors.capacity}</div>
              )}
            </div>

            {/* Schedule */}
            <div className="w-full">
              <label
                htmlFor="schedule"
                className="block text-sm font-medium text-dark900"
              >
                Schedule *
              </label>
              <Field
                type="text"
                id="schedule"
                name="schedule"
                className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                placeholder="e.g., Mondays 7-9 PM"
              />
              {errors.schedule && touched.schedule && (
                <div className="text-red-600 text-xs">{errors.schedule}</div>
              )}
            </div>

            {/* Class Format */}
            <div className="w-full">
              <label className="block text-sm font-medium text-dark900">
                Class Format *
              </label>
              <div className="flex flex-col space-y-2">
                <label>
                  <Field
                    type="radio"
                    name="classFormat"
                    value="In_Person"
                    className="mr-2"
                  />
                  In-Person
                </label>
                <label>
                  <Field
                    type="radio"
                    name="classFormat"
                    value="Online"
                    className="mr-2"
                  />
                  Online
                </label>
                <label>
                  <Field
                    type="radio"
                    name="classFormat"
                    value="Hybrid"
                    className="mr-2"
                  />
                  Hybrid (Both In-Person and Online)
                </label>
              </div>
              {errors.classFormat && touched.classFormat && (
                <div className="text-red-600 text-xs">{errors.classFormat}</div>
              )}
            </div>

            {/* Location */}
            {(values.classFormat === "In_Person" ||
              values.classFormat === "Hybrid") && (
              <div className="w-full">
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-dark900"
                >
                  Location *
                </label>
                <Field
                  type="text"
                  id="location"
                  name="location"
                  className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                  placeholder="Enter physical location"
                />
                {errors.location && touched.location && (
                  <div className="text-red-600 text-xs">{errors.location}</div>
                )}
              </div>
            )}

            {/* Meeting Link */}
            {(values.classFormat === "Online" ||
              values.classFormat === "Hybrid") && (
              <div className="w-full">
                <label
                  htmlFor="meetingLink"
                  className="block text-sm font-medium text-dark900"
                >
                  Meeting Link *
                </label>
                <Field
                  type="text"
                  id="meetingLink"
                  name="meetingLink"
                  className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                  placeholder="Enter online meeting link"
                />
                {errors.meetingLink && touched.meetingLink && (
                  <div className="text-red-600 text-xs">
                    {errors.meetingLink}
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="border border-primary text-dark900 px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-primary text-white px-6 py-2 rounded-lg"
              >
                {initialData?.id ? "Update Class" : "Create Class"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ClassForm;
