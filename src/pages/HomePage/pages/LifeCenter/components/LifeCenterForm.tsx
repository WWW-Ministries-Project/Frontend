import { FormikInputDiv } from "@/components/FormikInputDiv";
import { Field, Formik, Form } from "formik";
import MultiSelect from "@/components/MultiSelect";
import { Button } from "@/components";
import { LifeCenterType } from "@/utils";
import { useMemo } from "react";
import { object, string, array } from "yup";
import { FormHeader } from "@/components/ui";

interface IProps {
  closeModal: () => void;
  handleMutate: (value: LifeCenterType) => Promise<void>;
  loading: boolean;
  editData: LifeCenterType | null;
}
export function LifeCenterForm({
  closeModal,
  handleMutate,
  loading,
  editData,
}: IProps) {
  const initial: LifeCenterType = useMemo(
    () => editData || initialValues,
    [editData]
  );
  return (
    <div className=" ">
      
      <Formik
        initialValues={initial}
        validationSchema={validationSchema}
        onSubmit={async (values) => {
          await handleMutate(values);
        }}
        enableReinitialize
      >
        {({ setFieldValue, values, handleSubmit, errors }) => (
          <Form className="space-y-4">

            <FormHeader>
                  <p className="text-lg font-semibold">{initial.id ? "Update" : "Create"} Life Center</p>
                  <p className="text-sm text-white">
                    Provide the details of the life center.
                  </p>
                </FormHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4">
            <Field
              component={FormikInputDiv}
              name="name"
              label="Life center name"
              id="name"
              placeholder="Enter the name of the life center"
              className="w-full "
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
            {/* <div className="flex gap-5  items-start"> */}
              <Field
                component={FormikInputDiv}
                name="location"
                label="Meeting location"
                id="location"
                placeholder="Enter  meeting location"
                className="w-full"
              />
              <div className="md:mt-7 xl:mt-7 w-full">
                <label className='text-primary font-semibold' htmlFor="description">{"Meeting Days"}</label>
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
                {errors.meeting_dates && (
                  <p className="text-xs text-error">{errors.meeting_dates}</p>
                )}
              </div>
              </div>
            {/* </div> */}
            <div className="sticky bottom-0 z-10 bg-white border-t border-gray-100 px-6 py-4">
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
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

const meetingDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const initialValues: LifeCenterType = {
  description: "",
  location: "",
  meeting_dates: [],
  name: "",
  totalMembers: 0,
  totalSoulsWon: 0,
  id: "",
};

const validationSchema = object().shape({
  name: string()
    .required("Life center name is required")
    .min(3, "Name must be at least 3 characters"),
  location: string().required("Location is required"),
  description: string().optional(),
  meeting_dates: array()
    .min(1, "Select at least one meeting day")
    .of(string().required("Select one item"))
    .required("Meeting dates are required"),
});
