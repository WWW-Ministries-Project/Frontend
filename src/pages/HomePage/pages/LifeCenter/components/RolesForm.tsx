import { FormikInputDiv } from "@/components/FormikInputDiv";
import { Field, Formik, Form } from "formik";
import { Button } from "@/components";
import { useMemo } from "react";
import { object, string } from "yup";

interface IProps {
  closeModal: () => void;
  handleMutate: (value: { name: string }) => Promise<void>;
  loading: boolean;
  editData: { name: string; id: string } | null;
}
export function RolesForm({
  closeModal,
  handleMutate,
  loading,
  editData,
}: IProps) {
  const initial = useMemo(() => editData || initialValues, [editData]);
  return (
    <div className="w-[80vw] sm:w-[70vw] xl:w-[40vw] p-6">
      <h3 className="text-[#101840] font-semibold text-2xl  mb-4">
        {editData?.id ? "Edit Role" : "Create Role"}
      </h3>
      <Formik
        initialValues={initial}
        validationSchema={validationSchema}
        onSubmit={async (values) => {
          await handleMutate(values);
        }}
        enableReinitialize
      >
        {({ values, handleSubmit }) => (
          <Form className="space-y-4">
            <Field
              component={FormikInputDiv}
              name="name"
              label="Role name"
              id="name"
              placeholder="Enter role name"
            />

            <div className="flex justify-end gap-2">
              <Button
                value={values.id ? "Update" : "Save"}
                variant="primary"
                type="submit"
                onClick={handleSubmit}
                loading={loading}
                disabled={loading}
              />
              <Button value="Cancel" variant="secondary" onClick={closeModal} />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

const initialValues = {
  name: "",
  id: "",
};

const validationSchema = object().shape({
  name: string().required("Role name is required"),
});
