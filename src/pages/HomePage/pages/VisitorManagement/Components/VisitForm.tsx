import { useState, useEffect } from "react";
import { Formik, Field, Form } from "formik";
import * as Yup from "yup";
import { ApiCreationCalls } from "@/utils/api/apiPost";
import { ApiUpdateCalls } from "@/utils/api/apiPut";
// import { ApiCreationCalls } from "@/utils/apiPost"; // Assuming this is the API utility you use
// import { ApiUpdateCalls } from "@/utils/apiPut"; // Assuming this is the API utility for update requests

// Sample events data to select an event (you should fetch this from your API)
const eventsData = [
  {
    id: "1",
    name: "Sunday Service",
  },
  {
    id: "2",
    name: "Community Outreach",
  },
  // Add more events as needed
];

interface VisitFormProps {
  visitorId: string; // Visitor ID passed as a prop
  onClose: () => void; // Function to close the form
  initialData?: any; // Initial data for editing an existing visit
  fetchVisitorData?: () => void; // Optional function to fetch visitor data
}

const VisitForm: React.FC<VisitFormProps> = ({ visitorId, onClose, initialData, fetchVisitorData }) => {
  const [loading, setLoading] = useState(false);
  const apiCalls = new ApiCreationCalls();
  const apiPut = new ApiUpdateCalls();

  // If editing, pre-fill the form with initialData
  const initialValues = initialData
    ? {
        visitorId: initialData.visitorId || visitorId, // Default to visitorId if not in initialData
        date: initialData.date || "",
        eventId: initialData.eventId || "",
        notes: initialData.notes || "",
      }
    : {
        visitorId: visitorId,
        date: "",
        eventId: "",
        notes: "",
      };

  // Validation schema for the form
  const validationSchema = Yup.object({
    date: Yup.date().required("Visit date is required").typeError("Invalid date format"),
    eventId: Yup.string().required("Event selection is required"),
    notes: Yup.string().required("Notes are required").max(500, "Notes cannot exceed 500 characters"),
  });

  // Handle form submission
  const onSubmit = async (values: any) => {
    console.log("onSubmit", values);
    
    setLoading(true);
    const payload = {
      date: new Date(values.date).toISOString(),
      eventId: parseInt(values.eventId),
      notes: values.notes,
      visitorId:visitorId,
    }

    try {
      let response;
      if (initialData?.id) {
        // If initialData is provided, update the existing visit
        response = await apiPut.updateVisit(payload);
        console.log("Visit updated successfully", response);
      } else {
        // If no initialData, create a new visit
        response = await apiCalls.createVisit(payload);
        console.log("Visit created successfully", response);
      }

      if (response.status === 201 || response.status === 200) {
        onClose(); // Close the form on success
      } else {
        console.error("Error creating or updating visit");
      }
    } catch (error) {
      console.error("Error submitting visit data", error);
    } finally {
      setLoading(false);
      if (fetchVisitorData) {
        fetchVisitorData();
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg w-full max-w-3xl mx-auto">
      <div className="font-bold text-lg mb-4">{initialData ? "Edit Visit" : "Record a Visit"}</div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ values, handleChange, errors, touched }) => (
          <Form>
            {/* Visit Date */}
            <div className="mb-4">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Visit Date *
              </label>
              <Field
                type="date"
                id="date"
                name="date"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
              />
              {errors.date && touched.date && <div className="text-red-600 text-xs">{errors.date}</div>}
            </div>

            {/* Event Selection */}
            <div className="mb-4">
              <label htmlFor="eventId" className="block text-sm font-medium text-gray-700">
                Event *
              </label>
              <Field
                as="select"
                id="eventId"
                name="eventId"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select an Event</option>
                {eventsData.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </Field>
              {errors.eventId && touched.eventId && (
                <div className="text-red-600 text-xs">{errors.eventId}</div>
              )}
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes *
              </label>
              <Field
                as="textarea"
                id="notes"
                name="notes"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                placeholder="Enter any notes about the visit"
              />
              {errors.notes && touched.notes && <div className="text-red-600 text-xs">{errors.notes}</div>}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <div className="mt-4 text-center">
                <button
                  type="submit"
                  className="bg-primary text-white px-6 py-2 rounded-lg"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="border border-primary text-primary px-6 py-2 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default VisitForm;
