import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelect from "@/components/FormikSelect";
import { INameInfo, NameInfo } from "@/components/subform";
import { FormHeader } from "@/components/ui";
import { Actions } from "@/components/ui/form/Actions";
import { useFetch } from "@/CustomHooks/useFetch";
import { useStore } from "@/store/useStore";
import { api } from "@/utils";
import { Field, Form, Formik } from "formik";
import { useMemo } from "react";
import { object, string } from "yup";

// Type for selectedClass and Enrollment Form Props

interface IProps {
  onClose: () => void;
  onSubmit: (values: IStudentForm) => void;
  loading?: boolean;
}

export const StudentForm = ({ onClose, onSubmit, loading = false }: IProps) => {
  //api
  const {
    data,
    refetch: fetchAMembers,
    loading: memberLoading,
  } = useFetch(api.fetch.fetchAMember, {}, true);
  const memberData = data?.data || null;
  const membersOptions = useStore((state) => state.membersOptions);
  const initial: IStudentForm = useMemo(
    () =>
      memberData
        ? {
            user_id: memberData.id + "" || "",
            title: memberData.title || "",
            first_name: memberData.first_name || "",
            last_name: memberData.last_name || "",
            other_name: memberData.other_name || "",
            email: memberData.email || "",
          }
        : initialValues,
    [memberData]
  );
  return (
    <div className="bg-white rounded-lg md:w-[45rem] text-primary space-y-4 overflow-auto">
      
      <Formik
        initialValues={initial}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
        enableReinitialize
      >
        {({ handleSubmit }) => (
          <Form className="">
            <div className="sticky top-0 z-10">
                <FormHeader>
                  <p className="text-lg font-semibold">Enroll Student</p>
                  <p className="text-sm text-white">
                    Provide the details of the student you want to enroll.
                  </p>
                </FormHeader>
                
              </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Field
              component={FormikSelect}
              options={membersOptions}
              onChange={(_: string, selectedOption: string) => {
                fetchAMembers({ user_id: selectedOption });
              }}
              name="user_id"
              id="user_id"
              label="Select a member *"
              placeholder="Select a member *"
            />
            <NameInfo disabled />
            <Field
              component={FormikInputDiv}
              type="email"
              id="email"
              name="email"
              label="Email *"
              placeholder="Enter email"
              disabled
            />
            
            <Actions
              onCancel={onClose}
              loading={loading || memberLoading}
              onSubmit={handleSubmit}
            />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};
export interface IStudentForm extends INameInfo {
  user_id: string;
  email: string;
}
const initialValues: IStudentForm = {
  user_id: "",
  ...NameInfo.initialValues,
  email: "",
};

const validationSchema = object({
  ...NameInfo.validationSchema,
  user_id: string().required("Member is required"),
});
