import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import MultiSelect from "@/components/MultiSelect";
import { ProgramResponse } from "@/utils/api/ministrySchool/interfaces";
import { Field, FieldArray, Form, Formik } from "formik";
import { object } from "yup";

interface IProps {
  onClose: () => void;
  program?: ProgramResponse;
  prerequisitesDropdown: { label: string; value: string }[]; // Add prerequisitesDropdown property
  handleSubmit: (value: IProgramForm) => void; // Add setFeedback property
  loading?: boolean;
}

const ProgramFormComponent = ({
  onClose,
  program,
  prerequisitesDropdown,
  loading,
  handleSubmit,
}: IProps) => {
  const initial: IProgramForm = program
    ? {
        title: program.title,
        description: program.description,
        member_required: program.member_required,
        leader_required: program.leader_required,
        ministry_required: program.ministry_required,
        topics: program.topics.map((topic) => topic.name),
        prerequisites: program.prerequisitePrograms.map(
          (prerequisite) => prerequisite.title
        ),
        isPrerequisitesChecked: program.prerequisitePrograms.length > 0,
      }
    : initialValues;

  return (
    <div className="bg-white p-4 rounded-lg md:w-[45rem] max-h-[90vh] text-primary space-y-4">
      <div className="sticky top-0 bg-white p-4 border-b border-lightGray z-10">
        <div className="font-bold text-lg">
          {program?.id ? "Edit Program" : "Create New Program"}
        </div>
        <p className="text-sm">
          Fill in the program details to {program?.id ? "update" : "create"} a
          school program.
        </p>
      </div>

      <Formik initialValues={initial} onSubmit={handleSubmit}>
        {({ values, setFieldValue, handleSubmit }) => (
          <Form>
            <Field
              component={FormikInputDiv}
              type="text"
              placeholder="Enter program title"
              label="Program Title *"
              name="title"
              id="title"
            />
            <Field
              component={FormikInputDiv}
              type="textarea"
              placeholder="Enter program description"
              label="Description *"
              name="description"
              id="description"
            />
            {/* Eligibility */}
            {/* <div className="mb-4 space-y-2">
              <label className="block text-sm font-medium text-primary">
                Eligibility *
              </label>
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
            </div> */}

            {/* Completion Requirement */}
            <div className="mb-4 space-y-2">
              <label className="block text-sm font-medium text-primary">
                Completion of this program is required to become:
              </label>
              <div className="flex flex-col space-y-1 ml-2">
                <label>
                  <Field
                    type="checkbox"
                    name="member_required"
                    className="mr-2"
                  />
                  A Member
                </label>
                <label>
                  <Field
                    type="checkbox"
                    name="leader_required"
                    className="mr-2"
                  />
                  A Leader
                </label>
                <label>
                  <Field
                    type="checkbox"
                    name="ministry_required"
                    className="mr-2"
                  />
                  A Ministry Worker
                </label>
              </div>
            </div>

            {/* Program Topics */}
            <div className="mb-4 space-y-2">
              <label className="block text-sm font-medium text-primary">
                Program Topics
              </label>
              <FieldArray
                name="topics"
                render={({ push, remove }) => (
                  <div>
                    {values.topics.map((topic, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 mb-2"
                      >
                        <Field
                          // name={
                          //   program?.id
                          //     ? `topics[${index}].name`
                          //     : `topics[${index}]`
                          // }
                          name={`topics[${index}]`}
                          className="block w-full px-4 py-2 border border-lightGray rounded-lg"
                          placeholder="Enter a topic"
                        />
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            title="Remove Topic"
                            className="bg-red-500 text-white w-4 h-4 p-4 flex items-center justify-center rounded-full tooltip"
                          >
                            X
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="w-full flex justify-end">
                      <Button
                        type="button"
                        // onClick={() => {
                        //   if (values.newTopic) {
                        //     push(values.newTopic); // Add the topic as an object
                        //     setFieldValue("newTopic", "");
                        //   }
                        // }}
                        onClick={() => push("")}
                        variant="primary"
                        value="Add"
                      />
                    </div>
                  </div>
                )}
              />
            </div>

            {/* Prerequisites */}
            <div className="mb-4 space-y-2">
              <label className="block text-sm font-medium text-primary">
                Prerequisites
              </label>
              <div>
                <Field
                  type="checkbox"
                  name="isPrerequisitesChecked"
                  className="mr-2"
                />
                <span>Check if this program has prerequisites</span>
              </div>

              {values.isPrerequisitesChecked && (
                <MultiSelect
                  options={prerequisitesDropdown}
                  selectedValues={values.prerequisites}
                  onChange={(selected) =>
                    setFieldValue("prerequisites", selected)
                  }
                />
              )}
            </div>
            <div className="flex  gap-4 sticky bottom-0 bg-white p-4 border-t border-lightGray">
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
                onClick={handleSubmit}
                value="Save"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                value="Cancel"
              />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};
export interface IProgramForm {
  title: string;
  description: string;
  member_required: boolean;
  leader_required: boolean;
  ministry_required: boolean;
  topics: string[];
  prerequisites: string[];
  isPrerequisitesChecked: boolean;
}
const initialValues: IProgramForm = {
  title: "",
  description: "",
  member_required: false,
  leader_required: false,
  ministry_required: false,
  topics: [""],
  prerequisites: [],
  isPrerequisitesChecked: false,
};
const validationSchema = object().shape({});

export const ProgramForm = Object.assign(ProgramFormComponent, {
  initialValues,
  validationSchema,
});
