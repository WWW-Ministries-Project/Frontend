import { useState, useEffect } from "react";
import { Formik, Field, Form } from "formik";
import * as Yup from "yup";
import { ApiCreationCalls } from "@/utils/api/apiPost";
import { ApiCalls } from "@/utils/api/apiFetch";
import { ApiUpdateCalls } from "@/utils/api/apiPut";
// import { ApiCreationCalls } from "@/utils/apiPost"; // Assuming you have an API call utility
// import { ApiUpdateCalls } from "@/utils/apiPut"; // Assuming you have an API update utility
// import { ApiCalls } from "@/utils/apiFetch";

interface FollowUpFormProps {
    visitorId: string;
    onClose: () => void;
    initialData?: {
      id: number;
      date: string;
      type: string;
      status: string;
      notes: string;
      assignedTo: string;
    };
    selectedFollowUp?: {
      id: string;
      date: string;
      type: string;
      status: string;
      notes: string;
      assignedTo: string;
    };
  }

interface Member {
  id: string;
  name: string;
}

const FollowUpForm: React.FC<FollowUpFormProps> = ({ visitorId, selectedFollowUp, onClose }) => {
  const [members, setMembers] = useState<Member[]>([]); // State for storing members
  const [loading, setLoading] = useState<boolean>(false); // Loading state for fetching members
  const apiCalls = new ApiCreationCalls(); // Assuming you have a class for API calls
  const apiFetch = new ApiCalls(); // API utility class
  const apiUpdate = new ApiUpdateCalls(); // API utility class for updates

  // Fetch members from the backend
  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await apiFetch.fetchMembers(); // Replace with your API endpoint
      if (response.status === 200 && Array.isArray(response.data.data)) {
        setMembers(
          response.data.data.map((item: any) => ({
            id: item.id,
            name: `${item.user_info?.first_name || ""} ${item.user_info?.last_name || ""}`,
          }))
        );
      } else {
        console.error("Unexpected response format: data is not an array");
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  // Validation schema using Yup
  const validationSchema = Yup.object({
    date: Yup.date().required("Date is required").typeError("Invalid date format"),
    type: Yup.string().required("Type is required"),
    assignedTo: Yup.string().required("Assigned To is required"),
    notes: Yup.string().required("Notes are required"),
  });

  // On form submit, we send the selected data
  const onSubmit = async (values: any) => {
    setLoading(true);
    const payload = {
      visitorId,
      date: new Date(values.date).toISOString(),
      type: values.type,
      assignedTo: parseInt(values.assignedTo), // We send just the id here
      notes: values.notes,
    };

    try {
      let response;
      if (selectedFollowUp) {
        // Update existing follow-up
        response = await apiUpdate.updateFollowUp(selectedFollowUp.id, payload); // Assuming updateFollowUp API method
        if (response.status === 200) {
          console.log("Follow-up updated successfully");
        }
      } else {
        // Create new follow-up
        response = await apiCalls.createFollowUp(payload); // Assuming createFollowUp API method
        if (response.status === 201) {
          console.log("Follow-up created successfully");
        }
      }

      if (response.status === 200 || response.status === 201) {
        onClose(); // Close the form on success
      } else {
        console.error("Error creating/updating follow-up");
      }
    } catch (error) {
      console.error("Error submitting follow-up", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers(); // Fetch members when the component mounts
  }, []);

  // Pre-fill the form with selectedFollowUp data for editing
  const initialValues = {
    date: selectedFollowUp?.date || "",
    type: selectedFollowUp?.type || "phone", // Default to "phone"
    assignedTo: selectedFollowUp?.assignedTo || "", // If no assignedTo, default to empty
    notes: selectedFollowUp?.notes || "",
  };

  return (
    <div className="bg-white p-6 rounded-lg w-full max-w-md mx-auto">
      <div className="font-bold text-lg mb-4">
        {selectedFollowUp ? "Edit Follow-up" : "Record a Follow-up"}
      </div>
      {loading ? (
        <div>Loading members...</div>
      ) : (
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {({ values, setFieldValue, errors, touched }) => (
            <Form>
              {/* Date */}
              <div className="mb-4">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Date *
                </label>
                <Field
                  type="date"
                  id="date"
                  name="date"
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                />
                {errors.date && touched.date && <div className="text-red-600 text-xs">{errors.date}</div>}
              </div>

              {/* Type */}
              <div className="mb-4">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Type *
                </label>
                <Field
                  as="select"
                  id="type"
                  name="type"
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                >
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="in-person">In-person</option>
                </Field>
                {errors.type && touched.type && <div className="text-red-600 text-xs">{errors.type}</div>}
              </div>

              {/* Assigned To (Member Dropdown) */}
              <div className="mb-4">
                <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
                  Assigned To *
                </label>
                <Field
                  as="select"
                  id="assignedTo"
                  name="assignedTo"
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </Field>
                {errors.assignedTo && touched.assignedTo && (
                  <div className="text-red-600 text-xs">{errors.assignedTo}</div>
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
                  placeholder="Enter notes"
                />
                {errors.notes && touched.notes && <div className="text-red-600 text-xs">{errors.notes}</div>}
              </div>

              {/* Submit Button */}
              <div className="mt-4 text-center">
                <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg">
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      )}
    </div>
  );
};

export default FollowUpForm;
