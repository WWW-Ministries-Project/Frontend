import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import { FormHeader, FormLayout } from "@/components/ui";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { api } from "@/utils/api/apiCalls";
import { Field, Formik, Form } from "formik";
import { QueryType } from "@/utils/interfaces";

export interface FinanceConfigValues {
  id?: string | number;
  name: string;
  description: string;
  percentage?: number;
}

interface FinanceConfigFormProps {
  onClose: () => void;
  initialData?: Partial<FinanceConfigValues> & { id?: string | number };
  loading?: boolean;
  type: string;
  onSubmit?: (values: FinanceConfigValues) => void;
  refetch: (overrideQuery?: QueryType) => Promise<unknown> | void;
}

const FinanceConfigForm = ({
  onClose,
  initialData,
  loading = false,
  type,
  onSubmit,
  refetch
}: FinanceConfigFormProps) => {

  const {
      postData,
      loading: postLoading,
    } = usePost(type === "receipt" ? api.post.createReceiptConfig : type === "payment" ? api.post.createPaymentConfig : api.post.createBankAccountConfig);
    const {
      updateData,
      loading: putLoading,
    } = usePut(type === "receipt" ? api.put.updateReceiptConfig : type === "payment" ? api.put.updatePaymentConfig : api.put.updateBankAccountConfig);

    const handleSubmit = async (values: FinanceConfigValues) => {
                  try {
                    if (initialData?.id) {
                      // 🔄 UPDATE (query id + payload)
                      await updateData(
                        {
                          name: values.name,
                          description: values.description,
                          ...(type === "bankAccount" && {
                            percentage:
                              values.percentage !== undefined
                                ? Number(values.percentage)
                                : undefined,
                          }),
                        },
                        { id: String(initialData.id) }
                      );
                    } else {
                      // ➕ CREATE (payload only)
                      await postData({
                        name: values.name,
                        description: values.description,
                        ...(type === "bankAccount" && {
                          percentage: values.percentage !== undefined
                            ? Number(values.percentage)
                            : undefined,
                        }),
                      });
                    }

                    onSubmit?.(values);
                    
                  } 
                  
                  catch (error) {
                    console.error("Finance config submission failed", error);
                  }
                  finally {
                  await Promise.resolve(refetch());
                    onClose();
                  }
                }

    return ( 
        <div className=" ">
            <FormHeader>
                {initialData ? "Edit " : "Create "} {type}
            </FormHeader>
            <Formik
                initialValues={{
                  name: initialData?.name || "",
                  description: initialData?.description || "",
                  percentage: initialData?.percentage ?? 1,
                }}
                enableReinitialize
                onSubmit={handleSubmit}
              >
              {(formik) => (
              <Form className="mt-5 px-5 pb-5 space-y-6">
                <FormLayout $columns={1}>
                  <Field
                      component={FormikInputDiv}
                      label="Name *"
                      placeholder={`Enter the name of the ${type}`}
                      name={`name`}
                      id={`name`}
                  />
                  
                  <Field
                      component={FormikInputDiv}
                      type="textarea"
                      label="Description *"
                      placeholder="Enter description"
                      id="description"
                      name="description"
                  />

                   {type === "bankAccount" && <Field
                      component={FormikInputDiv}
                      type="number"
                      label="Percentage *"
                      placeholder="Enter percentage"
                      id="percentage"
                      name="percentage"
                  />}

                </FormLayout>
                <div className="flex gap-2 justify-end">
                  <Button value="Close" variant="ghost" type="button" onClick={onClose} />
                  <Button
                    value={initialData ? "Update" : "Save"}
                    variant="primary"
                    type="button"
                    disabled={postLoading || putLoading}
                    loading={postLoading || putLoading}
                    onClick={() => handleSubmit(formik.values)}
                  />
                </div>
              </Form>
              )}
            </Formik>
        </div>
     );
}
 
export default FinanceConfigForm;
