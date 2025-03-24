import { useState } from "react";
import { Formik, Field, Form, FieldArray } from "formik";
import MultiSelect from "@/components/MultiSelect";
import { ApiCreationCalls } from "@/utils/apiPost";

// Options for prerequisites (e.g., seniority levels)
const options = [
  { label: 'Senior associate', value: 'senior_associate' },
  { label: 'Expert', value: 'expert' },
  { label: 'Senior expert', value: 'senior_expert' },
  { label: 'Principal', value: 'principal' },
];

interface ProgramFormProps {
  onClose: () => void;
  program: { title: string; description: string; eligibility: string; topics: string[]; prerequisites: string[] }; // Define the Program type inline or import it
}

const ProgramForm: React.FC<ProgramFormProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const apiCalls = new ApiCreationCalls();  // Assuming you have a class for API calls

  const onSubmit = async (values: any) => {
    setLoading(true);  // Show loading state

    const payload = {
      title: values.title,
      description: values.description,
      eligibility: values.eligibility,
      topics: values.topics, // Array of strings (names of topics)
      prerequisites: values.isPrerequisitesChecked ? values.prerequisites : [], // If prerequisites are checked, include them
    };

    try {
      // Assuming you have an API method `createProgram` in your ApiCreationCalls class
      const response = await apiCalls.createProgram(payload);
      if (response.success) {
        console.log("Program created successfully:", response.data);
        // Optionally close the form or show success message
        onClose();
      } else {
        console.error("Error creating program:", response?.error || "Unknown error");
        // Show error message to user
      }
    } catch (error) {
      console.error("Error in submitting program:", error);
      // Handle error (e.g., show error message to user)
    } finally {
      setLoading(false);  // Stop loading
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg md:w-[45rem] text-dark900 space-y-4">
      <div>
        <div className="font-bold text-lg">Create New Program</div>
        <p className="text-sm">Fill in the program details to create a new school program.</p>
      </div>

      <Formik
        initialValues={{
          title: "",
          description: "",
          eligibility: "Both",
          topics: [],
          newTopic: "",
          isPrerequisitesChecked: false,
          prerequisites: [],
        }}
        onSubmit={onSubmit}
      >
        {({ values, setFieldValue, handleChange }) => (
          <Form>
            {/* Program Title */}
            <div className="mb-4 space-y-2">
              <label htmlFor="title" className="block text-sm font-medium text-dark900">
                Program Title *
              </label>
              <Field
                type="text"
                id="title"
                name="title"
                className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                placeholder="Enter program title"
              />
            </div>

            {/* Program Description */}
            <div className="mb-4 space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-dark900">
                Description *
              </label>
              <Field
                as="textarea"
                id="description"
                name="description"
                className="mt-1 block w-full px-4 py-2 border border-lightGray rounded-lg"
                placeholder="Enter program description"
              />
            </div>

            {/* Eligibility */}
            <div className="mb-4 space-y-2">
              <label className="block text-sm font-medium text-dark900">Eligibility *</label>
              <div className="flex flex-col items space-y-1">
                <label>
                  <Field
                    type="radio"
                    name="eligibility"
                    value="Members"
                    checked={values.eligibility === "Members"}
                    className="mr-2"
                  />
                  Members Only
                </label>
                <label>
                  <Field
                    type="radio"
                    name="eligibility"
                    value="Non_Members"
                    checked={values.eligibility === "Non_Members"}
                    className="mr-2"
                  />
                  Non Members Only
                </label>
                <label>
                  <Field
                    type="radio"
                    name="eligibility"
                    value="Both"
                    checked={values.eligibility === "Both"}
                    className="mr-2"
                  />
                  Both Members and Non Members
                </label>
              </div>
            </div>

            {/* Program Topics */}
            <div className="mb-4 space-y-2">
              <label className="block text-sm font-medium text-dark900">Program Topics</label>
              <FieldArray
                name="topics"
                render={({ push, remove }) => (
                  <div>
                    {values.topics.map((topic, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <Field
                          name={`topics[${index}]`}
                          className="block w-full px-4 py-2 border border-lightGray rounded-lg"
                          placeholder="Enter a topic"
                        />
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2">
                      <Field
                        type="text"
                        name="newTopic"
                        value={values.newTopic}
                        onChange={handleChange}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === "Enter" && values.newTopic) {
                            push(values.newTopic);  // Now just push the topic name as a string
                            setFieldValue("newTopic", "");
                          }
                        }}
                        className="block w-full px-4 py-2 border border-lightGray rounded-lg"
                        placeholder="Add a new topic"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (values.newTopic) {
                            push(values.newTopic);  // Now just push the topic name as a string
                            setFieldValue("newTopic", "");
                          }
                        }}
                        className="bg-primary text-white px-4 py-2 rounded-lg"
                      >
                        Add
                      </button>
                    </div>
                    <p className="text-xs">Press Enter or click Add Topic to add a new topic to the program</p>
                  </div>
                )}
              />
            </div>

            {/* Prerequisites */}
            <div className="mb-4 space-y-2">
              <label className="block text-sm font-medium text-dark900">Prerequisites</label>
              <div>
                <Field
                  type="checkbox"
                  name="isPrerequisitesChecked"
                  checked={values.isPrerequisitesChecked}
                  onChange={() => setFieldValue("isPrerequisitesChecked", !values.isPrerequisitesChecked)}
                  className="mr-2"
                />
                <span>Check if this program has prerequisites</span>
              </div>

              {values.isPrerequisitesChecked && (
                <div className="mt-2">
                  <MultiSelect
                    options={options}
                    selectedValues={values.prerequisites}
                    onChange={(selected) => setFieldValue("prerequisites", selected)}
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <div className="mt-4 text-center">
                <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg">
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

export default ProgramForm;
