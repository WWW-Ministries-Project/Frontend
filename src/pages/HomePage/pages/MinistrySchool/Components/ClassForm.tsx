import { Formik, Field, Form } from 'formik';
import * as Yup from 'yup';

interface ClassFormProps {
  onClose: () => void;
  onSubmit: (values: any) => void;
}

const ClassForm: React.FC<ClassFormProps> = ({ onClose, onSubmit }) => {
  const initialValues = {
    className: '',
    instructor: '',
    capacity: '',
    schedule: '',
    classFormat: 'hybrid',
    location: '',
    meetingLink: '',
  };

  const validationSchema = Yup.object({
    className: Yup.string().required('Class name is required'),
    instructor: Yup.string().required('Instructor name is required'),
    capacity: Yup.number().required('Capacity is required').positive().integer(),
    schedule: Yup.string().required('Schedule is required'),
    classFormat: Yup.string().required('Class format is required'),
    location: Yup.string().when('classFormat', {
      is: 'in-person',
      then: (schema) => schema.required('Location is required for in-person classes'),
    }),
    meetingLink: Yup.string().when('classFormat', {
      is: 'online',
      then: (schema) => schema.required('Meeting link is required for online classes'),
    }),
  });

  return (
    <div className="bg-white p-6 rounded-lg w-[45rem] text-dark900 space-y-4">
      <div className="text-lg font-bold text-center">Add New Class</div>
      <div className="text-sm text-center mb-4">Create a new class for the Spring 2023 cohort.</div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ errors, touched, values, setFieldValue }) => (
          <Form className="space-y-4">
            {/* Class Name */}
            <div className="flex gap-4">
              <div className="w-full">
                <label htmlFor="className" className="block text-sm font-medium text-dark900">
                  Class Name *
                </label>
                <Field
                  type="text"
                  id="className"
                  name="className"
                  className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                  placeholder="Enter class name"
                />
                {errors.className && touched.className && (
                  <div className="text-red-600 text-xs">{errors.className}</div>
                )}
              </div>
            </div>

            {/* Instructor */}
            <div className="flex gap-4">
              <div className="w-full">
                <label htmlFor="instructor" className="block text-sm font-medium text-dark900">
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
                  <div className="text-red-600 text-xs">{errors.instructor}</div>
                )}
              </div>
            </div>

            {/* Capacity */}
            <div className="flex gap-4">
              <div className="w-full">
                <label htmlFor="capacity" className="block text-sm font-medium text-dark900">
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
            </div>

            {/* Schedule */}
            <div className="flex gap-4">
              <div className="w-full">
                <label htmlFor="schedule" className="block text-sm font-medium text-dark900">
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
            </div>

            {/* Class Format */}
            <div className="flex gap-4">
              <div className="w-full">
                <label className="block text-sm font-medium text-dark900">Class Format *</label>
                <div className="space-y-2">
                  <label>
                    <Field
                      type="radio"
                      name="classFormat"
                      value="in-person"
                      className="mr-2"
                    />
                    In-Person
                  </label>
                  <label>
                    <Field
                      type="radio"
                      name="classFormat"
                      value="online"
                      className="mr-2"
                    />
                    Online
                  </label>
                  <label>
                    <Field
                      type="radio"
                      name="classFormat"
                      value="hybrid"
                      className="mr-2"
                    />
                    Hybrid (Both In-Person and Online)
                  </label>
                </div>
                {errors.classFormat && touched.classFormat && (
                  <div className="text-red-600 text-xs">{errors.classFormat}</div>
                )}
              </div>
            </div>

            {/* Location (shown only if "In-Person" is selected) */}
            {values.classFormat === 'in-person' && (
              <div className="flex gap-4">
                <div className="w-full">
                  <label htmlFor="location" className="block text-sm font-medium text-dark900">
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
              </div>
            )}

            {/* Meeting Link (shown only if "Online" or "Hybrid" is selected) */}
            {(values.classFormat === 'online' || values.classFormat === 'hybrid') && (
              <div className="flex gap-4">
                <div className="w-full">
                  <label htmlFor="meetingLink" className="block text-sm font-medium text-dark900">
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
                    <div className="text-red-600 text-xs">{errors.meetingLink}</div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-between gap-4 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="border border-primaryViolet text-primaryViolet px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-primaryViolet text-white px-6 py-2 rounded-lg"
              >
                Create Class
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ClassForm;
