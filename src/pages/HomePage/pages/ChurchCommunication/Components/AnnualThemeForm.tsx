import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { Button } from "@/components";
import ImageUpload from "@/components/ImageUpload";
import { FormHeader} from "@/components/ui";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import { api } from "@/utils/api/apiCalls";
import { usePut } from "@/CustomHooks/usePut";
import { usePost } from "@/CustomHooks/usePost";

export interface IAnnualThemeForm {
  id?: string | number;
  year: string;
  title: string;
  verseReference: string;
  verse: string;
  message: string;
  image?: string;
  isActive: boolean;
}

const initialValues: IAnnualThemeForm = {
  year: "",
  title: "",
  verseReference: "",
  verse: "",
  message: "",
  image: "",
  isActive: false,
};

const validationSchema = Yup.object({
  year: Yup.string().required("Year is required"),
  title: Yup.string().required("Theme title is required"),
});

interface AnnualThemeFormProps {
  initialValues?: IAnnualThemeForm;
  onClose?: () => void;
  loading?: boolean;
  refetch?: () => void;
}

const AnnualThemeFormComponent = ({
  initialValues: providedValues,
  onClose,
  loading,
  refetch
}: AnnualThemeFormProps) => {
  const [file, setFile] = useState<File | null>(null);
  
  const {
        postData,
        loading: postLoading,
        data: postSuccess,
      } = usePost(api.post.createAnnualTheme);
      const {
        updateData,
        loading: putLoading,
        data: putSuccess,
      } = usePut(api.put.updateAnnualTheme);

  const handleSubmitForm = async (values: IAnnualThemeForm) => {
    try {
      if (providedValues && values.id) {
        const { id, ...rest } = values;

        const payload = {
          ...rest,
        };

        console.log("Updating annual theme", payload);

        await updateData(payload, { id: String(id) });

        console.log("Update response", putSuccess);
      } else {
        const payload = {
          ...values,
        };

        console.log("Creating annual theme", payload);

        await postData(payload);

        console.log("Create response", postSuccess);
      }

      if (refetch) {
        refetch();
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Annual theme submit failed", error);
    }
  };
  

  return (
    <Formik
      initialValues={providedValues ?? initialValues}
      validationSchema={validationSchema}
      enableReinitialize
      onSubmit={handleSubmitForm}
    >
      {({ handleSubmit }) => (
        <Form className="h-[calc(100vh-180px)] flex flex-col overflow-auto ">
          
          <div className="sticky top-0 z-10">
                          <FormHeader>
                            <p className="text-lg font-semibold">
                                {providedValues ? "Edit Annual Theme" : "Create Annual Theme"}
                            </p>
                            <p className="text-sm text-white">
                                {providedValues
                                  ? "Make changes to the annual theme details"
                                  : "Fill in the details for the new annual theme"}
                            </p>
                          </FormHeader>
                        </div>
<div className="flex-1 overflow-y-auto space-y-4 px-6 py-4 ">
            <div className="grid grid-cols-2 gap-6">
              <Field
                component={FormikInputDiv}
                label="Year *"
                name="year"
                id="year"
                placeholder="2026"
              />

              <Field
                component={FormikInputDiv}
                label="Theme Title *"
                name="title"
                id="title"
                placeholder="Year of Breakthrough"
              />
            </div>

            <Field
              component={FormikInputDiv}
              label="Bible Verse Reference"
              name="verseReference"
              id="verseReference"
              placeholder="Jeremiah 29:11"
            />

            <Field
              component={FormikInputDiv}
              label="Bible Verse"
              name="verse"
              id="verse"
              type="textarea"
              inputClass="!h-32 resize-none"
              placeholder="For I know the plans I have for you..."
            />

            <Field
              component={FormikInputDiv}
              label="Theme Message"
              name="message"
              id="message"
              type="textarea"
              inputClass="!h-40 resize-none"
              placeholder="Describe what this theme means for the church this year..."
            />

            <div>
              <label className="block text-sm font-medium mb-2">
                Theme Image (Optional)
              </label>
              <ImageUpload
                onFileChange={(file: File) => setFile(file)}
                src={""}
              />
            </div>

            <div className="flex items-center">
              <Field
                type="checkbox"
                id="isActive"
                name="isActive"
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-sm">
                Set as current active theme
              </label>
            </div>
</div>
          <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
            {onClose && (
              <Button
                variant="secondary"
                type="button"
                value="Cancel"
                onClick={onClose}
              />
            )}

            <Button
              loading={loading || postLoading || putLoading}
              value={providedValues ? "Save Changes" : "Create Theme"}
              onClick={handleSubmit}
            />
          </div>
        </Form>
      )}
    </Formik>
  );
};

export const AnnualThemeForm = Object.assign(AnnualThemeFormComponent, {
  initialValues,
  validationSchema,
});

export default AnnualThemeForm;