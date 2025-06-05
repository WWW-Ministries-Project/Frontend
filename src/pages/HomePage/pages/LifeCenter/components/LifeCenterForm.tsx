import { FormikInputDiv } from "@/components/FormikInputDiv";
import { Field, Formik, Form } from "formik";
import * as Yup from "yup";
import { LifeCenterType } from "../LifeCenter";
import MultiSelect from "@/components/MultiSelect";
import { Button } from "@/components";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { api } from "@/utils/api/apiCalls";
import { showNotification } from "@/pages/HomePage/utils/helperFunctions";
import { useEffect } from "react";

const lifeCenterSchema = Yup.object().shape({
  name: Yup.string()
    .required("Life center name is required")
    .min(3, "Name must be at least 3 characters"),
  location: Yup.string().required("Location is required"),
  description: Yup.string().optional(),
  meeting_dates: Yup.array().min(1)
    .of(Yup.string().required("Each meeting date must be a string"))
    .optional(),
});

const meetingDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

type Props = {
  closeModal: () => void;
  addToList: (item: LifeCenterType) => void;
  initialValues: LifeCenterType;
  editItem: (item: LifeCenterType) => void;
};
export default function LifeCenterForm({
  closeModal,
  addToList,
  initialValues,
  editItem,
}: Props) {
  const postFunction = initialValues?.id
    ? api.put.updateLifeCenter
    : api.post.createLifeCenter;

  const { postData, data, loading } = usePost(postFunction);
  const {
    updateData,
    loading: is_updating,
  } = usePut(api.put.updateLifeCenter);
  
  const succesMessage = initialValues?.id
    ? "Life center updated successfully"
    : "Life center created successfully";

  useEffect(() => {
    if (data?.data) {
      addToList(data.data as LifeCenterType);
      showNotification(succesMessage, "success");

      if (initialValues.id) {
        editItem(data.data as LifeCenterType);
        showNotification(succesMessage, "success");
      }
    }
  }, [addToList, data, editItem, initialValues.id, succesMessage]);

  return (
    <div className="w-[80vw] sm:w-[70vw] xl:w-[40vw] p-6">
      <h3 className="text-[#101840] font-semibold text-2xl  mb-4">
        {initialValues?.id ? "Edit Life Center" : "Create Life Center"}
      </h3>
      <Formik
        initialValues={initialValues}
        validationSchema={lifeCenterSchema}
        onSubmit={async (values) => {
          if (initialValues.id) {
            await updateData(values, { id: String(values.id) });
            editItem(values);
            showNotification(succesMessage, "success");
          } else {
            await postData(values);
          }
        }}
        enableReinitialize
      >
        {({ setFieldValue, values, handleSubmit }) => (
          <Form className="space-y-4">
            <Field
              component={FormikInputDiv}
              name="name"
              label="Life center name"
              id="name"
              placeholder="Enter the name of the life center"
              className="w-full md:w-1/2 xl:w-1/2"
            />
            <Field
              component={FormikInputDiv}
              name="description"
              label="Description"
              id="description"
              placeholder="Enter a description"
              className="w-full"
              type="textarea"
              col={50}
            />
            <div className="flex gap-5 flex-col md:flex-row xl:flex-row items-start">
              <Field
                component={FormikInputDiv}
                name="location"
                label="Meeting location"
                id="location"
                placeholder="Enter  meeting location"
                className="w-full"
              />
              <div className="md:mt-7 xl:mt-7 w-full">
                <MultiSelect
                  options={meetingDays.map((day) => {
                    return {
                      label: day,
                      value: day,
                    };
                  })}
                  selectedValues={values.meeting_dates}
                  onChange={(selected) => {
                    setFieldValue("meeting_dates", selected);
                  }}
                  emptyMsg="No day(s) selected"
                  placeholder="day(s)"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                value={values.id ? "Update" : "Save"}
                variant="primary"
                type="submit"
                onClick={handleSubmit}
                loading={loading || is_updating}
                disabled={loading || is_updating}
              />
              <Button value="Cancel" variant="secondary" onClick={closeModal} />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
