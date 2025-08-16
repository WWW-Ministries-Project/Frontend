import { Field, Formik, Form } from "formik";
import { Button } from "@/components";
import { useMemo } from "react";
import { object, string } from "yup";
import FormikSelectField from "@/components/FormikSelect";
import { FormHeader } from "@/components/ui";
import { useStore } from "@/store/useStore";

interface IProps {
  onSubmit: (values: LifeCenterMemberForm) => void;
  onClose: () => void;
  editData: LifeCenterMemberForm | null;
  loading: boolean;
  roles: { label: string; value: string }[];
}
export function LifeCenterMemberForm({
  editData,
  loading,
  onClose,
  onSubmit,
  roles,
}: IProps) {
  const { membersOptions } = useStore();
  const initial = useMemo(() => editData || initialValues, [editData]);
  return (
    <Formik
      initialValues={initial}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        onSubmit(values);
      }}
    >
      {({ handleSubmit }) => (
        <Form className="space-y-6 ">
          <FormHeader >
            <p className="text-lg font-semibold">{initial.id ? "Update" : "Assign"} a Leader</p>
            <p className="text-sm">Select a member you’d like to appoint as a leader for this center.</p>
          </FormHeader>

          <div className="px-6 space-y-6">
            <Field
            name="userId"
            component={FormikSelectField}
            options={membersOptions}
            label="Select Leader *"
            id="userId"
            placeholder="Select a leader"
            disabled={initial.userId}
          />
          <Field
            name="roleId"
            component={FormikSelectField}
            options={roles}
            label="Select role *"
            id="roleId"
            placeholder="Select a role"
          />
          </div>

          <hr/>

          <div className="flex items-center justify-end gap-3 px-6 pb-6">
            <Button
              type="submit"
              disabled={loading}
              value={initial.id ? "Update" : "Save"}
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
            />
            <Button
              type="submit"
              disabled={loading}
              value="Cancel"
              variant="secondary"
              onClick={onClose}
            />
          </div>
        </Form>
      )}
    </Formik>
  );
}

export interface LifeCenterMemberForm {
  userId: string;
  roleId: string;
  lifeCenterId?: string;
  id?: string;
}

const initialValues: LifeCenterMemberForm = {
  roleId: "",
  userId: "",
};

const validationSchema = object().shape({
  userId: string().required(),
  roleId: string().required(),
});
