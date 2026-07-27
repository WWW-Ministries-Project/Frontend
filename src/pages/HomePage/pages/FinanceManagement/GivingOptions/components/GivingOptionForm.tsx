import { Button } from "@/components";
import { BranchSelectField } from "@/components/BranchSelectField";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { FormHeader, FormLayout } from "@/components/ui";
import { useFetch } from "@/CustomHooks/useFetch";
import { showNotification } from "@/pages/HomePage/utils";
import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils/api/apiCalls";
import type {
  GivingOption,
  GivingOptionPayload,
} from "@/utils/api/finance/interface";
import { Field, Form, Formik } from "formik";
import { useMemo, useState } from "react";
import {
  givingOptionSchema,
  type GivingOptionFormValues,
} from "../utils/givingOptionSchema";

interface IProps {
  onClose: () => void;
  onSaved: () => void | Promise<unknown>;
  initialData?: GivingOption;
}

const ACCOUNT_TYPE_OPTIONS = [
  { value: "ghipss", label: "Bank account" },
  { value: "mobile_money", label: "Mobile money" },
];

const CURRENCY = "GHS";

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    if (response?.data?.message) return response.data.message;
  }

  return error instanceof Error ? error.message : fallback;
};

const GivingOptionForm = ({ onClose, onSaved, initialData }: IProps) => {
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const [submitting, setSubmitting] = useState(false);
  const [resolving, setResolving] = useState(false);

  const { data: banksResponse, loading: banksLoading } = useFetch(
    api.fetch.fetchPaystackBanks,
    { currency: CURRENCY }
  );

  const banks = useMemo(
    () => (Array.isArray(banksResponse?.data) ? banksResponse.data : []),
    [banksResponse]
  );

  const handleSubmit = async (values: GivingOptionFormValues) => {
    if (activeBranchId === ALL_BRANCHES && !values.branch_id) {
      return;
    }

    const bank = banks.find((item) => item.code === values.settlement_bank);

    if (!bank) {
      showNotification("Select a bank or mobile money provider", "error");
      return;
    }

    const payload: GivingOptionPayload = {
      name: values.name.trim(),
      ...(values.description.trim() && {
        description: values.description.trim(),
      }),
      account_type: values.account_type,
      settlement_bank: bank.code,
      bank_name: bank.name,
      account_number: values.account_number.trim(),
      account_name: values.account_name.trim(),
      currency: CURRENCY,
      ...(values.branch_id !== "" && { branch_id: Number(values.branch_id) }),
    };

    setSubmitting(true);

    try {
      // Called directly rather than through usePost/usePut so a Paystack
      // rejection keeps the modal open with its message, instead of closing as
      // though the subaccount had been created.
      if (initialData?.id) {
        await api.put.updateGivingOption(payload, { id: initialData.id });
        showNotification("Giving option updated successfully", "success");
      } else {
        await api.post.createGivingOption(payload);
        showNotification("Giving option created successfully", "success");
      }

      await onSaved();
      onClose();
    } catch (error) {
      showNotification(
        extractErrorMessage(error, "Unable to save the giving option"),
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <FormHeader>
        {initialData ? "Edit giving option" : "Create giving option"}
      </FormHeader>

      <Formik<GivingOptionFormValues>
        initialValues={{
          name: initialData?.name ?? "",
          description: initialData?.description ?? "",
          account_type: initialData?.account_type ?? "ghipss",
          settlement_bank: initialData?.settlement_bank ?? "",
          account_number: initialData?.account_number ?? "",
          account_name: initialData?.account_name ?? "",
          branch_id: initialData?.branch_id ?? ("" as number | ""),
        }}
        validationSchema={givingOptionSchema}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, submitCount, handleBlur }) => {
          const bankOptions = banks
            .filter((bank) =>
              values.account_type === "mobile_money"
                ? bank.type === "mobile_money"
                : bank.type !== "mobile_money"
            )
            .map((bank) => ({ value: bank.code, label: bank.name }));

          /**
           * Convenience only. Paystack's resolve endpoint has patchy coverage in
           * Ghana, so a miss is silent and the typed name stands.
           */
          const tryResolveAccountName = async () => {
            const accountNumber = values.account_number.trim();

            if (!values.settlement_bank || !/^[0-9]{5,20}$/.test(accountNumber)) {
              return;
            }

            setResolving(true);

            try {
              const response = await api.fetch.resolveBankAccount({
                account_number: accountNumber,
                bank_code: values.settlement_bank,
              });

              if (response?.data?.account_name) {
                setFieldValue("account_name", response.data.account_name);
              }
            } catch {
              // Deliberately silent — the field stays editable.
            } finally {
              setResolving(false);
            }
          };

          return (
            <Form className="space-y-6 px-5 pb-5 pt-5">
              <FormLayout $columns={1}>
                <BranchSelectField
                  value={values.branch_id ?? ""}
                  onChange={(v) => setFieldValue("branch_id", v)}
                  required
                  error={
                    submitCount > 0 &&
                    activeBranchId === ALL_BRANCHES &&
                    !values.branch_id
                      ? "Branch is required"
                      : undefined
                  }
                />

                <Field
                  component={FormikInputDiv}
                  label="Name *"
                  placeholder="e.g. Building Fund"
                  id="name"
                  name="name"
                />

                <Field
                  component={FormikInputDiv}
                  type="textarea"
                  label="Description"
                  placeholder="What is this giving option for?"
                  id="description"
                  name="description"
                />

                <Field
                  component={FormikSelectField}
                  label="Settlement account type *"
                  id="account_type"
                  name="account_type"
                  options={ACCOUNT_TYPE_OPTIONS}
                  onChange={(_name: string, value: string | number | null) => {
                    setFieldValue("account_type", value ?? "ghipss");
                    // Bank codes are not shared between the two lists.
                    setFieldValue("settlement_bank", "");
                  }}
                />

                <Field
                  component={FormikSelectField}
                  label={
                    values.account_type === "mobile_money"
                      ? "Mobile money provider *"
                      : "Bank *"
                  }
                  id="settlement_bank"
                  name="settlement_bank"
                  options={bankOptions}
                  searchable
                  searchPlaceholder="Search"
                  placeholder={
                    banksLoading ? "Loading providers..." : "Select"
                  }
                  disabled={banksLoading || bankOptions.length === 0}
                  helperText={
                    !banksLoading && bankOptions.length === 0
                      ? "Could not load the list from Paystack. Check the server's Paystack configuration."
                      : undefined
                  }
                />

                <Field
                  component={FormikInputDiv}
                  label={
                    values.account_type === "mobile_money"
                      ? "Mobile money number *"
                      : "Account number *"
                  }
                  placeholder="Enter the settlement account number"
                  id="account_number"
                  name="account_number"
                  onBlur={(
                    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) => {
                    // Keep Formik's own blur handling; the lookup is additive.
                    handleBlur(event);
                    void tryResolveAccountName();
                  }}
                />

                <Field
                  component={FormikInputDiv}
                  label="Account name *"
                  placeholder={
                    resolving ? "Looking up account name..." : "Account holder name"
                  }
                  id="account_name"
                  name="account_name"
                />
              </FormLayout>

              <p className="rounded-lg bg-lightGray/30 px-4 py-3 text-xs text-primaryGray">
                Payments made to this giving option are routed in full to this
                account. Paystack transaction fees are deducted from it, and no
                portion is split to any other account.
              </p>

              <div className="flex justify-end gap-2">
                <Button
                  value="Close"
                  variant="secondary"
                  type="button"
                  onClick={onClose}
                />
                <Button
                  value={initialData ? "Update" : "Save"}
                  variant="primary"
                  type="submit"
                  disabled={submitting}
                  loading={submitting}
                />
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default GivingOptionForm;
