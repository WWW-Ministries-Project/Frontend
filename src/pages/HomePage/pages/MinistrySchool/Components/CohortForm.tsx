import { ApiCreationCalls } from "@/utils/api/apiPost"; // for creating
import { ApiUpdateCalls } from "@/utils/api/apiPut"; // for updating
import { Field, Form, Formik } from "formik";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as Yup from "yup";

interface CohortFormProps {
  onClose: () => void;
  cohort?: {
    id: number;
    name: string;
    description: string;
    startDate: Date;
    applicationDeadline: string;
    duration: string;
    status: string;
  }; // Cohort object to edit (optional)
  programId: number; // Program ID for the cohort
  fetchProgramData: () => void; //
}

const CohortForm: React.FC<CohortFormProps> = ({
  onClose,
  cohort,
  programId,
  fetchProgramData,
}) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [applicationDeadline, setApplicationDeadline] = useState<Date | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const apiCreate = new ApiCreationCalls(); // For creating new cohort
  const apiUpdate = new ApiUpdateCalls(); // For updating existing cohort

  // Set initial values with the cohort's values if provided
  const initialValues = {
    name: cohort?.name || "",
    duration: cohort?.duration || "",
    description: cohort?.description || "",
    startDate: cohort?.startDate ? new Date(cohort.startDate) : null, // Convert to Date if exists
    applicationDeadline: cohort?.applicationDeadline
      ? new Date(cohort.applicationDeadline)
      : null, // Convert to Date if exists
    status: cohort?.status || "Upcoming",
  };

  const validationSchema = Yup.object({
    name: Yup.string().required("Cohort name is required"),
    duration: Yup.string().required("Duration is required"),
    description: Yup.string().required("Description is required"),
    startDate: Yup.date().required("Start date is required"),
    applicationDeadline: Yup.date()
      .required("Application deadline is required")
      .max(
        Yup.ref("startDate"),
        "Application deadline must be before the cohort start date"
      ),
    status: Yup.string().required("Status is required"),
  });

  const onSubmit = async (values: any) => {
    setLoading(true); // Show loading state

    const payload = {
      name: values.name,
      duration: values.duration,
      description: values.description,
      startDate: values.startDate,
      applicationDeadline: values.applicationDeadline,
      status: values.status,
      programId, // Associate the cohort with a specific program
    };

    console.log("onSubmit", payload);

    try {
      if (cohort?.id) {
        // Update existing cohort if ID is provided
        const response = await apiUpdate.updateCohort({
          id: cohort.id,
          payload,
        });
        if (response.success) {
          console.log("Cohort updated successfully:", response.data);
          onClose(); // Close the form
        } else {
          console.error(
            "Error updating cohort:",
            response?.error || "Unknown error"
          );
        }
      } else {
        // Create new cohort if no ID is provided
        const response = await apiCreate.createCohort(payload);
        if (response.success) {
          console.log("Cohort created successfully:", response.data);
          onClose(); // Close the form
        } else {
          console.error(
            "Error creating cohort:",
            response?.error || "Unknown error"
          );
        }
      }
    } catch (error) {
      console.error("Error submitting cohort:", error);
    } finally {
      setLoading(false); // Stop loading
      fetchProgramData();
      onClose(); // Close the form
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg md:w-[45rem] text-dark900 space-y-4">
      <div>
        <div className="text-lg font-bold">
          {cohort?.id ? "Edit Cohort" : "Create New Cohort"}
        </div>
        <div className="text-sm mb-4">
          Create or edit a cohort for the program.
        </div>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ setFieldValue, errors, touched, values, handleChange }) => (
          <Form className="space-y-4">
            {/* Cohort Name */}
            <div className="flex gap-4">
              <div className="w-full">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-dark900"
                >
                  Cohort Name *
                </label>
                <Field
                  type="text"
                  id="name"
                  name="name"
                  className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                  placeholder="e.g., Spring 2023, Cohort #5"
                />
                {errors.name && touched.name && (
                  <div className="text-red-600 text-xs">{errors.name}</div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="w-full">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-dark900"
              >
                Description *
              </label>
              <Field
                as="textarea"
                id="description"
                name="description"
                className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                placeholder="Enter cohort description"
              />
              {errors.description && touched.description && (
                <div className="text-red-600 text-xs">{errors.description}</div>
              )}
            </div>

            <div className="grid lg:grid-cols-2">
              {/* Start Date */}
              <div className="w-full">
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-dark900"
                >
                  Start Date *
                </label>
                <DatePicker
                  selected={values.startDate || startDate} // Set initial value
                  onChange={(date) => {
                    setStartDate(date);
                    setFieldValue("startDate", date);
                  }}
                  dateFormat="yyyy-MM-dd"
                  className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                  placeholderText="Pick a date"
                />
                {errors.startDate && touched.startDate && (
                  <div className="text-red-600 text-xs">{errors.startDate}</div>
                )}
              </div>

              {/* Duration */}
              <div className="w-full">
                <label
                  htmlFor="duration"
                  className="block text-sm font-medium text-dark900"
                >
                  Duration *
                </label>
                <Field
                  type="text"
                  id="duration"
                  name="duration"
                  className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                  placeholder="e.g., 8 weeks, 3 months"
                />
                {errors.duration && touched.duration && (
                  <div className="text-red-600 text-xs">{errors.duration}</div>
                )}
              </div>
            </div>

            {/* Application Deadline */}
            <div className="grid lg:grid-cols-2">
              <div className="w-full">
                <label
                  htmlFor="applicationDeadline"
                  className="block text-sm font-medium text-dark900"
                >
                  Application Deadline *
                </label>
                <DatePicker
                  selected={values.applicationDeadline || applicationDeadline} // Set initial value
                  onChange={(date) => {
                    setApplicationDeadline(date);
                    setFieldValue("applicationDeadline", date);
                  }}
                  dateFormat="yyyy-MM-dd"
                  className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                  placeholderText="Pick a date"
                  maxDate={values.startDate || startDate}
                />
                {errors.applicationDeadline && touched.applicationDeadline && (
                  <div className="text-red-600 text-xs">
                    {errors.applicationDeadline}
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="w-full">
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-dark900"
                >
                  Status *
                </label>
                <Field
                  as="select"
                  id="status"
                  name="status"
                  className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </Field>
                {errors.status && touched.status && (
                  <div className="text-red-600 text-xs">{errors.status}</div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="border border-primaryViolet text-primaryViolet px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-primary text-white px-6 py-2 rounded-lg"
              >
                {loading
                  ? "Submitting..."
                  : cohort?.id
                  ? "Update Cohort"
                  : "Create Cohort"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CohortForm;
