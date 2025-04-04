import { useState } from "react";
import { Formik, Field, Form } from "formik";
import * as Yup from "yup";
import { ApiCreationCalls } from "@/utils/apiPost"; // Assuming you have an API call utility
import { ApiUpdateCalls } from "@/utils/apiPut"; // Assuming you have an API update utility

// Sample event data structure
const eventsData = [
  {
    id: 1,
    name: "Test Event",
    start_date: "2025-08-04T00:00:00.000Z",
    end_date: "2025-08-04T00:00:00.000Z",
    location: "Autem cum pariatur ",
    description: "Quas placeat magni ",
    event_status: null,
    poster: "",
    qr_code: "https://res.cloudinary.com/dt8vgj0u3/image/upload/v1743357893/www-ministires/events_qr/tyzr9duzz68xltjdtwqa.png",
    event_type: "SERVICE",
    start_time: "08:44",
    end_time: "15:58",
    event_attendance: []
  },
  // Add more events to this array for selection
];

// Options for "How did you hear" and "Event"
const howHeardOptions = [
    { label: "Friend", value: "friend" },
    { label: "Advertisement", value: "advertisement" },
    { label: "Social Media", value: "social_media" },
    { label: "Other", value: "other" },
  ];

interface VisitorFormProps {
  onClose: () => void;
  selectedVisitor?: any; // Pass selectedVisitor as prop to pre-populate the form
}

const VisitorForm: React.FC<VisitorFormProps> = ({ onClose, selectedVisitor }) => {
  const [loading, setLoading] = useState(false);
  const apiCalls = new ApiCreationCalls();
  const apiPut = new ApiUpdateCalls();

  // If editing, pre-fill the form with selectedVisitor data
  const initialValues = {
    firstName: selectedVisitor?.firstName || "",
    lastName: selectedVisitor?.lastName || "",
    email: selectedVisitor?.email || "",
    phone: selectedVisitor?.phone || "",
    country: selectedVisitor?.country || "",
    address: selectedVisitor?.address || "",
    city: selectedVisitor?.city || "",
    state: selectedVisitor?.state || "",
    visitDate: selectedVisitor?.visitDate || "", // Ensure this is a valid ISO-8601 date string
    howHeard: selectedVisitor?.howHeard || "friend", // Adding back the howHeard field
    consentToContact: selectedVisitor?.consentToContact || true,
    membershipWish: selectedVisitor?.membershipWish || true,
    event: selectedVisitor?.event || null, // Initially set to null or an event object if available
  };

  const validationSchema = Yup.object({
    firstName: Yup.string().required("First name is required"),
    lastName: Yup.string().required("Last name is required"),
    email: Yup.string().email("Invalid email format").required("Email is required"),
    phone: Yup.string().required("Phone number is required"),
    country: Yup.string().required("Country is required"),
    address: Yup.string().required("Address is required"),
    city: Yup.string().required("City is required"),
    state: Yup.string().required("State is required"),
    visitDate: Yup.date().required("Visit date is required").typeError("Invalid date format"),
    howHeard: Yup.string().required("How did you hear about us?"),
    // event: Yup.string().required("Please select an event"), // Ensure event is selected
  });

  const onSubmit = async (values: any) => {
    setLoading(true);

    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      country: values.country,
      address: values.address,
      city: values.city,
      state: values.state,
      visitDate: new Date(values.visitDate).toISOString(), // Ensure the visitDate is in ISO-8601 format
      howHeard: values.howHeard,
      consentToContact: values.consentToContact,
      membershipWish: values.membershipWish,
    };

    try {
      let response;
      // If selectedVisitor exists, update the visitor; otherwise, create a new one
      if (selectedVisitor?.id) {
        response = await apiPut.updateVisitor({ id: selectedVisitor.id, ...payload }); // Assuming updateVisitor API method
        console.log("Visitor updated successfully", response);
      } else {
        response = await apiCalls.createVisitor(payload); // Assuming createVisitor API method
        console.log("Visitor created successfully", response);
      }

      if (response.status === 201) {
        // After saving the visitor, create a visit (only now we pass the event)
        const visitorId  = response?.data.data.id; // Assuming the visitor ID is returned in response.data
        

        if (visitorId) {
          const visitPayload = {
            visitorId,
            date: new Date(values.visitDate).toISOString(), // We will pass this correctly formatted
            eventId: parseInt(values.event, 10), // Event ID
          };

          // Create the visit
          await apiCalls.createVisit(visitPayload); // Assuming createVisit API method
          console.log("Visit created successfully");
          onClose();
        } else {
          console.error("Event not found for the visit.");
        }
      } else {
        console.error("Error creating/updating visitor");
      }
    } catch (error) {
      console.error("Error in submitting visitor", error);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg w-full max-w-3xl mx-auto">
      <div className="font-bold text-lg mb-4">Visitor Registration</div>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ values, setFieldValue, errors, touched }) => (
          <Form>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <Field
                  type="text"
                  id="firstName"
                  name="firstName"
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="John"
                />
                {errors.firstName && touched.firstName && (
                  <div className="text-red-600 text-xs">{errors.firstName}</div>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <Field
                  type="text"
                  id="lastName"
                  name="lastName"
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="Smith"
                />
                {errors.lastName && touched.lastName && (
                  <div className="text-red-600 text-xs">{errors.lastName}</div>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <Field
                  type="email"
                  id="email"
                  name="email"
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="john.smith@example.com"
                />
                {errors.email && touched.email && (
                  <div className="text-red-600 text-xs">{errors.email}</div>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone *
                </label>
                <Field
                  type="text"
                  id="phone"
                  name="phone"
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="(555) 123-4567"
                />
                {errors.phone && touched.phone && (
                  <div className="text-red-600 text-xs">{errors.phone}</div>
                )}
              </div>

              {/* Country */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country *
                </label>
                <Field
                  type="text"
                  id="country"
                  name="country"
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="USA"
                />
                {errors.country && touched.country && (
                  <div className="text-red-600 text-xs">{errors.country}</div>
                )}
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address *
                </label>
                <Field
                  type="text"
                  id="address"
                  name="address"
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="123 Main St"
                />
                {errors.address && touched.address && (
                  <div className="text-red-600 text-xs">{errors.address}</div>
                )}
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City *
                </label>
                <Field
                  type="text"
                  id="city"
                  name="city"
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="Springfield"
                />
                {errors.city && touched.city && (
                  <div className="text-red-600 text-xs">{errors.city}</div>
                )}
              </div>

              {/* State */}
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State *
                </label>
                <Field
                  type="text"
                  id="state"
                  name="state"
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="IL"
                />
                {errors.state && touched.state && (
                  <div className="text-red-600 text-xs">{errors.state}</div>
                )}
              </div>

              {/* Visit Date */}
              <div>
                <label htmlFor="visitDate" className="block text-sm font-medium text-gray-700">
                  Visit Date *
                </label>
                <Field
                  type="date"
                  id="visitDate"
                  name="visitDate"
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                />
                {errors.visitDate && touched.visitDate && (
                  <div className="text-red-600 text-xs">{errors.visitDate}</div>
                )}
              </div>

              {/* Event */}
              <div>
                <label htmlFor="event" className="block text-sm font-medium text-gray-700">
                  Event *
                </label>
                <Field
                  as="select"
                  id="event"
                  name="event"
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                >
                  {eventsData.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </Field>
                {errors.event && touched.event && (
                  <div className="text-red-600 text-xs">{errors.event}</div>
                )}
              </div>

              {/* How did you hear? */}
              <div>
                <label htmlFor="howHeard" className="block text-sm font-medium text-gray-700">
                  How did you hear about us? *
                </label>
                <Field
                  as="select"
                  id="howHeard"
                  name="howHeard"
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                >
                  {howHeardOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Field>
                {errors.howHeard && touched.howHeard && (
                  <div className="text-red-600 text-xs">{errors.howHeard}</div>
                )}
              </div>

              {/* Consent to Contact */}
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

              {/* Membership Wish */}
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

              {/* Submit Button */}

              <div className="flex gap-4">
              <div className="mt-4 text-center">
                <button
                  type="submit"
                  className="bg-primary text-white px-6 py-2 rounded-lg"
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
              
              </div>
            </div>
          </Form>
        )}
      </Formik>
      <div className="mt-4 text-center">
                <button
                  onClick={onClose}
                  className="bg-primary text-white px-6 py-2 rounded-lg"
                >
                  {"Cancel"}
                </button>
              </div>
    </div>
  );
};

export default VisitorForm;
