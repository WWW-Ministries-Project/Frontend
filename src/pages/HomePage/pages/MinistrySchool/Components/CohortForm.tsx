import { useState } from 'react';
import { Formik, Field, Form } from 'formik';
import * as Yup from 'yup';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface CohortFormProps {
  onClose: () => void;
  onSubmit: (values: any) => void;
}

const CohortForm: React.FC<CohortFormProps> = ({ onClose, onSubmit }) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [applicationDeadline, setApplicationDeadline] = useState<Date | null>(null);

  const initialValues = {
    cohortName: '',
    duration: '',
    description: '',
    startDate: '',
    applicationDeadline: '',
    status: 'Upcoming',
  };

  const validationSchema = Yup.object({
    cohortName: Yup.string().required('Cohort name is required'),
    duration: Yup.string().required('Duration is required'),
    description: Yup.string().required('Description is required'),
    startDate: Yup.date().required('Start date is required'),
    applicationDeadline: Yup.date()
      .required('Application deadline is required')
      .max(
        Yup.ref('startDate'),
        'Application deadline must be before the cohort start date'
      ),
    status: Yup.string().required('Status is required'),
  });

  return (
    <div className="bg-white p-6 rounded-lg md:w-[45rem] text-dark900 space-y-4">
      <div>
      <div className="text-lg font-bold">Add New Cohort</div>
      <div className="text-sm mb-4">Create a new cohort for the Biblical Leadership program.</div>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ setFieldValue, errors, touched, values }) => (
          <Form className="space-y-4">
            {/* Cohort Name */}
            <div className="flex gap-4">
              <div className="w-full">
                <label htmlFor="cohortName" className="block text-sm font-medium text-dark900">
                  Cohort Name *
                </label>
                <Field
                  type="text"
                  id="cohortName"
                  name="cohortName"
                  className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                  placeholder="e.g., Spring 2023, Cohort #5"
                />
                {errors.cohortName && touched.cohortName && (
                  <div className="text-red-600 text-xs">{errors.cohortName}</div>
                )}
              </div>
            </div>

            

            {/* Description */}
            <div className="w-full">
              <label htmlFor="description" className="block text-sm font-medium text-dark900">
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
             <div className="flex">
              <div className="w-full">
                <label htmlFor="startDate" className="block text-sm font-medium text-dark900">
                  Start Date *
                </label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    setFieldValue('startDate', date);
                  }}
                  dateFormat="yyyy-MM-dd"
                  className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                  placeholderText="Pick a date"
                />
                {errors.startDate && touched.startDate && (
                  <div className="text-red-600 text-xs">{errors.startDate}</div>
                )}
              </div>
            </div>

            {/* Duration */}
            <div className="flex gap-4">
              <div className="w-full">
                <label htmlFor="duration" className="block text-sm font-medium text-dark900">
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
           </div>

            {/* Application Deadline */}
            <div className='grid lg:grid-cols-2'>
            <div className="flex gap-4">
              <div className="w-full">
                <label htmlFor="applicationDeadline" className="block text-sm font-medium text-dark900">
                  Application Deadline *
                </label>
                <DatePicker
                  selected={applicationDeadline}
                  onChange={(date) => {
                    setApplicationDeadline(date);
                    setFieldValue('applicationDeadline', date);
                  }}
                  dateFormat="yyyy-MM-dd"
                  className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                  placeholderText="Pick a date"
                  minDate={startDate || undefined} // Ensure the deadline is before start date
                />
                {errors.applicationDeadline && touched.applicationDeadline && (
                  <div className="text-red-600 text-xs">{errors.applicationDeadline}</div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex gap-4">
              <div className="w-full">
                <label htmlFor="status" className="block text-sm font-medium text-dark900">
                  Status *
                </label>
                <Field as="select" id="status" name="status" className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg">
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </Field>
                {errors.status && touched.status && (
                  <div className="text-red-600 text-xs">{errors.status}</div>
                )}
              </div>
            </div>
            </div>

            {/* Submit Button */}
            <div className="flex  gap-4 mt-4">
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
                onClick={onSubmit}
              >
                Create Cohort
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CohortForm;
