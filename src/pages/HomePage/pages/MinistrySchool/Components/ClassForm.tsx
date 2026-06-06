import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { FormHeader, FormLayout, FullWidth } from "@/components/ui";
import { Actions } from "@/components/ui/form/Actions";
import { BranchSelectField } from "@/components/BranchSelectField";
import { useBranchStore, ALL_BRANCHES } from "@/store/useBranchStore";
import { useFetch } from "@/CustomHooks/useFetch";
import { useStore } from "@/store/useStore";
import { api } from "@/utils/api/apiCalls";
import { Field, Form, Formik } from "formik";
import { useEffect, useMemo } from "react";
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
  const setMemberOptions = useStore((state) => state.setMemberOptions);

  const { data: membersOptionsData } = useFetch(
    api.fetch.fetchMembersForOptions,
    undefined,
    membersOptions.length > 0
  );

  useEffect(() => {
    if (membersOptionsData?.data?.length) {
      setMemberOptions(membersOptionsData.data);
    }
  }, [membersOptionsData, setMemberOptions]);

  const initial = useMemo(() => {
    return {
      ...initialValues,
      ...initialData,
      meetingLink: initialData?.meetingLink || "",
      location: initialData?.location || "",
    };
  }, [initialData]);
  return (
    <div className="bg-white  rounded-lg max-h-[90vh] md:h-full md:w-[45rem] text-primary space-y-4 overflow-auto">
      

      <Formik
        initialValues={initial}
        validationSchema={validationSchema}
        onSubmit={(values) => onSubmit({ ...values, capacity: Number(values.capacity) })}
      >
        {({ errors, touched, values, handleSubmit, setFieldValue }) => (
          <Form>
            <div className="sticky top-0 z-10">
                <FormHeader>
                  <p className="text-lg font-semibold">{initialData ? "Edit Class" : "Add New Class"}</p>
                  <p className="text-sm text-white">
                    {initialData
            ? "Edit the details of the class"
            : "Create a new class for the cohort."}
                  </p>
                </FormHeader>
                
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
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

            <FullWidth>
              <BranchSelectField
                value={values.branch_id}
                onChange={(v) => setFieldValue("branch_id", v)}
                required
                error={typeof errors.branch_id === "string" ? errors.branch_id : undefined}
              />
            </FullWidth>

            {/* Class Format */}
            <FullWidth>
              <div className="">
                <label className="block t font-semibold text-primary pb-1">
                  Class Format *
                </label>
                <div className="flex md:flex-row flex-col gap-4 " >
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
          </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export interface IClassForm {
  id?: number;
  name: string;
  instructorId: number|undefined;
  capacity: number;
  schedule: string;
  classFormat: string;
  location?: string;
  meetingLink?: string;
  branch_id: number | "";
}
const initialValues: IClassForm = {
  name: "",
  instructorId: undefined,
  capacity: 0,
  schedule: "",
  classFormat: "",
  branch_id: "",
};
const validationSchema = object({
  name: string().required("required"),
  instructorId: number().required("required"),
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
  branch_id: number().when([], {
    is: () => useBranchStore.getState().activeBranchId === ALL_BRANCHES,
    then: (schema) => schema.required("required"),
    otherwise: (schema) => schema.optional(),
  }),
});
