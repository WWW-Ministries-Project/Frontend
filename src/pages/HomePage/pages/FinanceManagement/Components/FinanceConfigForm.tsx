import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import { FormHeader, FormLayout } from "@/components/ui";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { api } from "@/utils/api/apiCalls";
import { Field, Formik, Form } from "formik";
import { QueryType } from "@/utils/interfaces";
import { BranchSelectField } from "@/components/BranchSelectField";
import { useBranchStore, ALL_BRANCHES } from "@/store/useBranchStore";

export interface FinanceConfigValues {
  id?: string | number;
  name: string;
  description: string;
  percentage?: number;
  branch_id?: number | "";
}

interface FinanceConfigFormProps {
  onClose: () => void;
  initialData?: Partial<FinanceConfigValues> & { id?: string | number };
  type: string;
  onSubmit?: (values: FinanceConfigValues) => void;
  refetch: (overrideQuery?: QueryType) => Promise<unknown> | void;
}

const FinanceConfigForm = ({
  onClose,
  initialData,
  type,
  onSubmit,
  refetch
}: FinanceConfigFormProps) => {
  const activeBranchId = useBranchStore((state) => state.activeBranchId);

  const {
      postData,
      loading: postLoading,
    } = usePost(type === "receipt" ? api.post.createReceiptConfig : type === "payment" ? api.post.createPaymentConfig : type==="tithe"? api.post.createTitheBreakdownConfig : api.post.createBankAccountConfig);
    const {
      updateData,
      loading: putLoading,
    } = usePut(type === "receipt" ? api.put.updateReceiptConfig : type === "payment" ? api.put.updatePaymentConfig : type==="tithe"? api.put.updateTitheBreakdownConfig : api.put.updateBankAccountConfig);

    const handleSubmit = async (values: FinanceConfigValues) => {
      if (activeBranchId === ALL_BRANCHES && !values.branch_id) {
        return;
      }
      try {
        const payload = {
          name: values.name,
          description: values.description,
          ...(values.branch_id !== "" && values.branch_id !== undefined && { branch_id: values.branch_id }),
          ...((type === "bankAccount" || type === "tithe") && {
            percentage:
              values.percentage !== undefined
                ? Number(values.percentage)
                : undefined,
          }),
        };

        if (initialData?.id) {
          await updateData(payload, { id: String(initialData.id) });
        } else {
          await postData(payload);
        }

        await Promise.resolve(refetch());
        onSubmit?.(values);
        onClose();
      } catch {
        // silent fail - caller handles notifications
      }
    };

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
                  branch_id: initialData?.branch_id ?? ("" as number | ""),
                }}
                enableReinitialize
                onSubmit={handleSubmit}
              >
              {({ values, setFieldValue, submitCount }) => (
              <Form className="space-y-6 px-5 pb-5 pt-5">
                <FormLayout $columns={1}>
                  <BranchSelectField
                    value={values.branch_id ?? ""}
                    onChange={(v) => setFieldValue("branch_id", v)}
                    required
                    error={submitCount > 0 && activeBranchId === ALL_BRANCHES && !values.branch_id ? "Branch is required" : undefined}
                  />
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

                   {(type === "bankAccount" || type === "tithe") && <Field
                      component={FormikInputDiv}
                      type="number"
                      label="Percentage *"
                      placeholder="Enter percentage"
                      id="percentage"
                      name="percentage"
                  />}

                </FormLayout>
                <div className="flex gap-2 justify-end">
                  <Button value="Close" variant="secondary" type="button" onClick={onClose} />
                  <Button
                    value={initialData ? "Update" : "Save"}
                    variant="primary"
                    type="submit"
                    disabled={postLoading || putLoading}
                    loading={postLoading || putLoading}
                  />
                </div>
              </Form>
              )}
            </Formik>
        </div>
     );
}
 
export default FinanceConfigForm;
