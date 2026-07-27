import * as Yup from "yup";

export const givingOptionSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required("Name is required")
    .max(120, "Name must be 120 characters or fewer"),
  description: Yup.string().trim().max(500, "Description is too long"),
  account_type: Yup.string()
    .oneOf(["ghipss", "mobile_money"], "Select a valid account type")
    .required("Account type is required"),
  settlement_bank: Yup.string().trim().required("Bank or provider is required"),
  account_number: Yup.string()
    .trim()
    .matches(/^[0-9]{5,20}$/, "Account number must be 5 to 20 digits")
    .required("Account number is required"),
  account_name: Yup.string().trim().required("Account name is required"),
});

export type GivingOptionFormValues = {
  name: string;
  description: string;
  account_type: "ghipss" | "mobile_money";
  settlement_bank: string;
  account_number: string;
  account_name: string;
  branch_id: number | "";
};
