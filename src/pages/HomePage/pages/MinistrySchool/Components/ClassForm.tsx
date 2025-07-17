import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { FormLayout, FullWidth } from "@/components/ui";
import { Actions } from "@/components/ui/form/Actions";
import { useStore } from "@/store/useStore";
import { Field, Formik } from "formik";
import { useMemo } from "react";
import { number, object, string } from "yup";

interface IProps {
  onClose: () => void;
  onSubmit: (values: IClassForm) => void;
  initialData?: IClassForm;
  loading?: boolean;
}

export const ClassForm = ({
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: IProps) => {
  const membersOptions = useStore((state) => state.membersOptions);

  const initial = useMemo(() => {
    return {
      ...initialValues,
      ...initialData,
      meetingLink: initialData?.meetingLink || "",
      location: initialData?.location || "",
    };
  }, [initialData]);
  return (
    <div className="bg-white p-6 rounded-lg max-h-[90vh] md:h-full md:w-[45rem] text-primary space-y-4 overflow-auto">
      <div>
        <div className="text-lg font-bold">
          {initialData ? "Edit Class" : "Add New Class"}
        </div>
        <div className="text-sm mb-4">
          {initialData
            ? "Edit the details of the class"
            : "Create a new class for the cohort."}
        </div>
      </div>

      <Formik
        initialValues={initial}
        validationSchema={validationSchema}
        onSubmit={(values) => onSubmit(validationSchema.cast(values))}
      >
        {({ errors, touched, values, handleSubmit }) => (
          <FormLayout>
            <Field
              component={FormikInputDiv}
              label="Class Name *"
              id="name"
              name="name"
              placeholder="Enter class name"
            />
            <Field
              component={FormikSelectField}
              id="instructorId"
              name="instructorId"
              label="Instructor Name *"
              placeholder="Enter instructor name"
              options={membersOptions}
            />
            <Field
              component={FormikInputDiv}
              type="number"
              id="capacity"
              name="capacity"
              label="Capacity *"
              placeholder="Maximum number of students"
            />
            <Field
              component={FormikInputDiv}
              id="schedule"
              name="schedule"
              label="Schedule *"
              placeholder="e.g., Mondays 7-9 PM"
            />

            {/* Class Format */}
            <FullWidth>
              <div className="">
                <label className="block text-sm font-medium text-primary">
                  Class Format *
                </label>
                <div className="flex gap-4" >
                  <label className="">
                    <Field
                      type="radio"
                      name="classFormat"
                      value="In_Person"
                      className="mr-1"
                    />
                    In-Person
                  </label>
                  <label className="">
                    <Field
                      type="radio"
                      name="classFormat"
                      value="Online"
                      className="mr-1"
                    />
                    Online
                  </label>
                  <label className="">
                    <Field
                      type="radio"
                      name="classFormat"
                      value="Hybrid"
                      className="mr-1"
                    />
                    Hybrid (Both In-Person and Online)
                  </label>
                </div>
                {errors.classFormat && touched.classFormat && (
                  <div className="text-red-600 text-xs">
                    {errors.classFormat}
                  </div>
                )}
              </div>
            </FullWidth>
            {(values.classFormat === "In_Person" ||
              values.classFormat === "Hybrid") && (
              <Field
                component={FormikInputDiv}
                id="location"
                name="location"
                label="Location *"
                placeholder="Enter physical location"
              />
            )}
            {(values.classFormat === "Online" ||
              values.classFormat === "Hybrid") && (
              <Field
                component={FormikInputDiv}
                id="meetingLink"
                name="meetingLink"
                label="Online Meeting Link *"
                placeholder="Enter online meeting link"
              />
            )}
            <Actions
              onCancel={onClose}
              onSubmit={handleSubmit}
              loading={loading}
            />
          </FormLayout>
        )}
      </Formik>
    </div>
  );
};

export interface IClassForm {
  id?: number;
  name: string;
  instructorId: string;
  capacity: number;
  schedule: string;
  classFormat: string;
  location?: string;
  meetingLink?: string;
}
const initialValues: IClassForm = {
  name: "",
  instructorId: "",
  capacity: 0,
  schedule: "",
  classFormat: "",
};
const validationSchema = object({
  name: string().required("required"),
  instructorId: string().required("required"),
  capacity: number()
    .transform((value, originalValue) => Number(originalValue))
    .typeError("must be a number")
    .required("required")
    .positive("must be positive")
    .integer("must be an integer"),
  schedule: string().required("required"),
  classFormat: string().required("required"),
  location: string().when("classFormat", {
    is: (value: string) => value === "In_Person" || value === "Hybrid",
    then: (schema) =>
      schema.required("Location is required for in-person or hybrid classes"),
  }),
  meetingLink: string().when("classFormat", {
    is: (value: string) => value === "Online" || value === "Hybrid",
    then: (schema) =>
      schema.required("Meeting link is required for online or hybrid classes").url("Invalid URL"),
  }),
});
